from datetime import date, datetime
from decimal import Decimal
import os
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from DataBaseSchema import (
    AlertaEstoque,
    Categoria,
    Fornecedor,
    Lote,
    Movimentacao,
    Produto,
    SessionLocal,
    TipoMovimentacao,
    Base,
    engine,
    get_db,
)

app = FastAPI(title="Supermercado API", version="1.0.0")

# Permite o frontend Vite local consumir a API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CategoriaOut(BaseModel):
    id: int
    nome: str

    class Config:
        from_attributes = True


class CategoriaCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    descricao: Optional[str] = None


class ProdutoCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=150)
    categoria_id: int = Field(gt=0)
    fornecedor_id: int = Field(gt=0)
    descricao: Optional[str] = None
    preco_unitario: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    quantidade_estoque: int = Field(ge=0)
    estoque_minimo: int = Field(ge=0)
    data_validade: date


class ProdutoUpdate(BaseModel):
    nome: str = Field(min_length=1, max_length=150)
    categoria_id: int = Field(gt=0)
    fornecedor_id: int = Field(gt=0)
    descricao: Optional[str] = None
    preco_unitario: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    quantidade_estoque: int = Field(ge=0)
    estoque_minimo: int = Field(ge=0)
    data_validade: date


class EstoqueUpdate(BaseModel):
    quantidade_estoque: int = Field(ge=0)


class ProdutoOut(BaseModel):
    id: int
    nome: str
    categoria: CategoriaOut
    preco_unitario: Decimal
    quantidade_estoque: int
    estoque_minimo: int
    data_validade: date

    class Config:
        from_attributes = True


class AlertaOut(BaseModel):
    id: int
    produto_id: int
    produto_nome: str
    quantidade_no_momento: int
    estoque_minimo: int
    resolvido: bool
    created_at: datetime


def _mais_proximo_vencimento(produto: Produto) -> Optional[date]:
    hoje = date.today()
    datas = [l.data_validade for l in produto.lotes if l.quantidade > 0]
    if not datas:
        datas = [l.data_validade for l in produto.lotes]
    futuras = [d for d in datas if d >= hoje]
    return min(futuras or datas) if datas else None


def _produto_out(produto: Produto) -> ProdutoOut:
    validade = _mais_proximo_vencimento(produto)
    if validade is None:
        # O contrato do frontend exige uma validade. Produtos sem lote não
        # devem ser devolvidos como se tivessem validade inventada.
        raise HTTPException(
            status_code=409,
            detail=f"Produto {produto.id} não possui lote com data de validade.",
        )
    return ProdutoOut(
        id=produto.id,
        nome=produto.nome,
        categoria=CategoriaOut.model_validate(produto.categoria),
        preco_unitario=produto.preco_unitario,
        quantidade_estoque=produto.quantidade_estoque,
        estoque_minimo=produto.estoque_minimo,
        data_validade=validade,
    )


def _get_categoria(db: Session, categoria_id: int) -> Categoria:
    categoria = db.get(Categoria, categoria_id)
    if not categoria:
        raise HTTPException(status_code=400, detail="Categoria não encontrada.")
    return categoria


def _get_fornecedor(db: Session, fornecedor_id: int) -> Fornecedor:
    fornecedor = db.get(Fornecedor, fornecedor_id)
    if not fornecedor:
        raise HTTPException(status_code=400, detail="Fornecedor não encontrado.")
    return fornecedor


def _criar_lote(db: Session, produto_id: int, quantidade: int, validade: date) -> Lote:
    lote = Lote(
        produto_id=produto_id,
        numero_lote=f"API-{produto_id}-{date.today().strftime('%Y%m%d')}",
        quantidade=quantidade,
        data_validade=validade,
    )
    # O mesmo produto pode ser cadastrado mais de uma vez no mesmo dia.
    existente = db.execute(
        select(Lote).where(Lote.produto_id == produto_id).order_by(Lote.id.desc())
    ).scalars().first()
    if existente and existente.numero_lote == lote.numero_lote:
        lote.numero_lote = f"{lote.numero_lote}-{(existente.id or 0) + 1}"
    db.add(lote)
    return lote


def _sincronizar_lote_principal(
    db: Session, produto: Produto, quantidade: int, validade: date
) -> None:
    lotes = sorted(produto.lotes, key=lambda l: l.id or 0)
    if lotes:
        principal = lotes[0]
        principal.data_validade = validade
        principal.quantidade = quantidade
    else:
        _criar_lote(db, produto.id, quantidade, validade)


def _instalar_triggers():
    # As funções/triggers são criadas somente depois de todas as tabelas,
    # evitando referência a tabelas que ainda não foram criadas.
    statements = [
        """
        CREATE OR REPLACE FUNCTION fn_verifica_estoque_baixo()
        RETURNS TRIGGER AS $$
        BEGIN
            IF TG_OP = 'INSERT'
               OR (NEW.quantidade_estoque <= NEW.estoque_minimo
                   AND OLD.quantidade_estoque > NEW.estoque_minimo) THEN
                IF NEW.quantidade_estoque <= NEW.estoque_minimo THEN
                    INSERT INTO alertas_estoque
                        (produto_id, quantidade_no_momento, estoque_minimo, resolvido, created_at)
                    VALUES
                        (NEW.id, NEW.quantidade_estoque, NEW.estoque_minimo, 0, NOW());
                END IF;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """,
        """
        DROP TRIGGER IF EXISTS trg_verifica_estoque_baixo ON produtos;
        CREATE TRIGGER trg_verifica_estoque_baixo
        AFTER INSERT OR UPDATE OF quantidade_estoque ON produtos
        FOR EACH ROW EXECUTE FUNCTION fn_verifica_estoque_baixo();
        """,
        """
        CREATE OR REPLACE FUNCTION fn_audita_movimentacao()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO auditoria_movimentacoes
                (movimentacao_id, produto_id, tipo, quantidade_anterior,
                 quantidade_nova, usuario, acao, data_acao)
            VALUES
                (NEW.id, NEW.produto_id, NEW.tipo::text, 0, NEW.quantidade,
                 CURRENT_USER, 'INSERT', NOW());
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """,
        """
        DROP TRIGGER IF EXISTS trg_audita_movimentacao ON movimentacoes;
        CREATE TRIGGER trg_audita_movimentacao
        AFTER INSERT ON movimentacoes
        FOR EACH ROW EXECUTE FUNCTION fn_audita_movimentacao();
        """,
    ]
    with engine.begin() as conn:
        for statement in statements:
            conn.exec_driver_sql(statement)


def _seed_defaults():
    db = SessionLocal()
    try:
        categorias = {
            "Hortifrúti": "Produtos frescos e hortifrutigranjeiros.",
            "Industrializado": "Produtos industrializados.",
            "Limpeza": "Produtos de limpeza.",
        }
        for nome, descricao in categorias.items():
            if not db.execute(select(Categoria).where(Categoria.nome == nome)).scalar_one_or_none():
                db.add(Categoria(nome=nome, descricao=descricao))

        if not db.execute(select(Fornecedor).where(Fornecedor.id == 1)).scalar_one_or_none():
            db.add(
                Fornecedor(
                    id=1,
                    nome="Fornecedor padrão",
                    contato="Cadastro inicial da aplicação",
                )
            )
        db.commit()
    finally:
        db.close()


@app.on_event("startup")
def startup_db():
    Base.metadata.create_all(bind=engine)
    _seed_defaults()
    _instalar_triggers()


@app.get("/")
def read_root():
    return {"message": "API do Supermercado funcionando!"}


@app.get("/test")
def teste():
    return {"message": "Rota de teste funcionando!"}


@app.get("/categorias", response_model=list[CategoriaOut])
def listar_categorias(db: Session = Depends(get_db)):
    return db.execute(select(Categoria).order_by(Categoria.nome)).scalars().all()


@app.post("/categorias", response_model=CategoriaOut, status_code=status.HTTP_201_CREATED)
def criar_categoria(payload: CategoriaCreate, db: Session = Depends(get_db)):
    nome = payload.nome.strip()
    existente = db.execute(
        select(Categoria).where(func.lower(Categoria.nome) == nome.lower())
    ).scalar_one_or_none()
    if existente:
        raise HTTPException(status_code=409, detail="Categoria já cadastrada.")
    categoria = Categoria(nome=nome, descricao=payload.descricao)
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria


@app.get("/produtos", response_model=list[ProdutoOut])
def listar_produtos(db: Session = Depends(get_db)):
    produtos = db.execute(
        select(Produto)
        .options(
            joinedload(Produto.categoria),
            joinedload(Produto.lotes),
        )
        .order_by(Produto.id)
    ).unique().scalars().all()
    return [_produto_out(p) for p in produtos]


@app.get("/produtos/{produto_id}", response_model=ProdutoOut)
def obter_produto(produto_id: int, db: Session = Depends(get_db)):
    produto = db.execute(
        select(Produto)
        .options(joinedload(Produto.categoria), joinedload(Produto.lotes))
        .where(Produto.id == produto_id)
    ).unique().scalar_one_or_none()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    return _produto_out(produto)


@app.post("/produtos", response_model=ProdutoOut, status_code=status.HTTP_201_CREATED)
def criar_produto(payload: ProdutoCreate, db: Session = Depends(get_db)):
    categoria = _get_categoria(db, payload.categoria_id)
    fornecedor = _get_fornecedor(db, payload.fornecedor_id)

    produto = Produto(
        nome=payload.nome.strip(),
        categoria=categoria,
        fornecedor=fornecedor,
        descricao=payload.descricao,
        preco_unitario=payload.preco_unitario,
        quantidade_estoque=payload.quantidade_estoque,
        estoque_minimo=payload.estoque_minimo,
    )
    db.add(produto)
    db.flush()

    lote = Lote(
        produto_id=produto.id,
        numero_lote=f"API-{produto.id}-{date.today().strftime('%Y%m%d')}",
        quantidade=payload.quantidade_estoque,
        data_validade=payload.data_validade,
    )
    db.add(lote)

    if payload.quantidade_estoque:
        db.add(
            Movimentacao(
                produto_id=produto.id,
                lote=lote,
                tipo=TipoMovimentacao.ENTRADA,
                quantidade=payload.quantidade_estoque,
                observacao="Cadastro do produto pela API",
            )
        )

    db.commit()
    db.refresh(produto)
    return _produto_out(
        db.execute(
            select(Produto)
            .options(joinedload(Produto.categoria), joinedload(Produto.lotes))
            .where(Produto.id == produto.id)
        ).unique().scalar_one()
    )


@app.put("/produtos/{produto_id}", response_model=ProdutoOut)
def atualizar_produto(produto_id: int, payload: ProdutoUpdate, db: Session = Depends(get_db)):
    produto = db.execute(
        select(Produto)
        .options(joinedload(Produto.categoria), joinedload(Produto.lotes))
        .where(Produto.id == produto_id)
    ).unique().scalar_one_or_none()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")

    categoria = _get_categoria(db, payload.categoria_id)
    fornecedor = _get_fornecedor(db, payload.fornecedor_id)

    produto.nome = payload.nome.strip()
    produto.categoria = categoria
    produto.fornecedor = fornecedor
    produto.descricao = payload.descricao
    produto.preco_unitario = payload.preco_unitario
    produto.estoque_minimo = payload.estoque_minimo

    quantidade_anterior = produto.quantidade_estoque
    if payload.quantidade_estoque != quantidade_anterior:
        produto.quantidade_estoque = payload.quantidade_estoque
        delta = payload.quantidade_estoque - quantidade_anterior
        tipo = TipoMovimentacao.ENTRADA if delta > 0 else TipoMovimentacao.SAIDA
        if delta:
            db.add(
                Movimentacao(
                    produto=produto,
                    tipo=tipo,
                    quantidade=abs(delta),
                    observacao="Ajuste de estoque pela edição do produto",
                )
            )

    _sincronizar_lote_principal(
        db, produto, payload.quantidade_estoque, payload.data_validade
    )
    db.commit()

    produto = db.execute(
        select(Produto)
        .options(joinedload(Produto.categoria), joinedload(Produto.lotes))
        .where(Produto.id == produto_id)
    ).unique().scalar_one()
    return _produto_out(produto)


@app.patch("/produtos/{produto_id}", response_model=ProdutoOut)
def atualizar_estoque(
    produto_id: int, payload: EstoqueUpdate, db: Session = Depends(get_db)
):
    produto = db.execute(
        select(Produto)
        .options(joinedload(Produto.categoria), joinedload(Produto.lotes))
        .where(Produto.id == produto_id)
    ).unique().scalar_one_or_none()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")

    anterior = produto.quantidade_estoque
    nova = payload.quantidade_estoque
    if nova == anterior:
        return _produto_out(produto)

    delta = nova - anterior
    produto.quantidade_estoque = nova

    lotes = sorted(produto.lotes, key=lambda l: l.id or 0)
    if lotes:
        lotes[0].quantidade = nova

    db.add(
        Movimentacao(
            produto=produto,
            lote=lotes[0] if lotes else None,
            tipo=TipoMovimentacao.ENTRADA if delta > 0 else TipoMovimentacao.SAIDA,
            quantidade=abs(delta),
            observacao="Movimentação de estoque pela API",
        )
    )
    db.commit()

    produto = db.execute(
        select(Produto)
        .options(joinedload(Produto.categoria), joinedload(Produto.lotes))
        .where(Produto.id == produto_id)
    ).unique().scalar_one()
    return _produto_out(produto)


@app.delete("/produtos/{produto_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_produto(produto_id: int, db: Session = Depends(get_db)):
    produto = db.get(Produto, produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    db.delete(produto)
    db.commit()
    return None


@app.get("/alertas/estoque", response_model=list[AlertaOut])
def listar_alertas_estoque(db: Session = Depends(get_db)):
    rows = db.execute(
        select(AlertaEstoque, Produto.nome)
        .join(Produto, Produto.id == AlertaEstoque.produto_id)
        .where(AlertaEstoque.resolvido == 0)
        .order_by(AlertaEstoque.created_at.desc())
    ).all()
    return [
        AlertaOut(
            id=a.id,
            produto_id=a.produto_id,
            produto_nome=nome,
            quantidade_no_momento=a.quantidade_no_momento,
            estoque_minimo=a.estoque_minimo,
            resolvido=bool(a.resolvido),
            created_at=a.created_at,
        )
        for a, nome in rows
    ]
