from enum import Enum as PyEnum
import os
from datetime import datetime, timezone
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Numeric,
    ForeignKey,
    DateTime,
    Date,
    Enum,
    UniqueConstraint,
    event,
    DDL,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

Base = declarative_base()

class TipoMovimentacao(PyEnum):
    ENTRADA = "ENTRADA"
    SAIDA = "SAIDA"

class Categoria(Base):
    __tablename__ = 'categorias'

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    descricao = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    produtos = relationship("Produto", back_populates="categoria")

class Fornecedor(Base):
    __tablename__ = 'fornecedores'

    id = Column(Integer, primary_key=True)
    nome = Column(String(150), nullable=False)
    contato = Column(String(100), nullable=True)
    telefone = Column(String(30), nullable=True)
    email = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    produtos = relationship("Produto", back_populates="fornecedor")

class Produto(Base):
    __tablename__ = 'produtos'

    id = Column(Integer, primary_key=True)
    nome = Column(String(150), nullable=False)
    categoria_id = Column(Integer, ForeignKey('categorias.id'), nullable=False)
    fornecedor_id = Column(Integer, ForeignKey('fornecedores.id'), nullable=False)
    descricao = Column(String, nullable=True)
    quantidade_estoque = Column(Integer, nullable=False, default=0)
    estoque_minimo = Column(Integer, nullable=False, default=0)
    preco_unitario = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    categoria = relationship("Categoria", back_populates="produtos")
    fornecedor = relationship("Fornecedor", back_populates="produtos")
    lotes = relationship("Lote", back_populates="produto", cascade="all, delete-orphan")
    movimentacoes = relationship("Movimentacao", back_populates="produto", cascade="all, delete-orphan")
    alertas_estoque = relationship("AlertaEstoque", back_populates="produto", cascade="all, delete-orphan")

class Lote(Base):
    __tablename__ = 'lotes'

    id = Column(Integer, primary_key=True)
    produto_id = Column(Integer, ForeignKey('produtos.id'), nullable=False)
    numero_lote = Column(String(50), nullable=False)
    quantidade = Column(Integer, nullable=False)
    data_fabricacao = Column(Date, nullable=True)
    data_validade = Column(Date, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint('produto_id', 'numero_lote', name='uq_produto_lote'),
    )

    produto = relationship("Produto", back_populates="lotes")
    movimentacoes = relationship("Movimentacao", back_populates="lote", cascade="all, delete-orphan")

class Movimentacao(Base):
    __tablename__ = 'movimentacoes'

    id = Column(Integer, primary_key=True)
    produto_id = Column(Integer, ForeignKey('produtos.id'), nullable=False)
    lote_id = Column(Integer, ForeignKey('lotes.id'), nullable=True)
    tipo = Column(Enum(TipoMovimentacao), nullable=False)
    quantidade = Column(Integer, nullable=False)
    observacao = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    produto = relationship("Produto", back_populates="movimentacoes")
    lote = relationship("Lote", back_populates="movimentacoes")

class AlertaEstoque(Base):
    __tablename__ = 'alertas_estoque'

    id = Column(Integer, primary_key=True)
    produto_id = Column(Integer, ForeignKey('produtos.id'), nullable=False)
    quantidade_no_momento = Column(Integer, nullable=False)
    estoque_minimo = Column(Integer, nullable=False)
    resolvido = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

    produto = relationship("Produto", back_populates="alertas_estoque")

class AuditoriaMovimentacoes(Base):
    __tablename__ = 'auditoria_movimentacoes'

    movimentacao_id = Column(Integer, primary_key=True, nullable=False)
    produto_id = Column(Integer, primary_key=True, nullable=False)
    
    tipo = Column(String(50), nullable=True)
    quantidade_anterior = Column(Integer, nullable=True)
    quantidade_nova = Column(Integer, nullable=True)
    usuario = Column(String(100), nullable=True)
    acao = Column(String(100), nullable=True)
    data_acao = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# Triggers PostgreSQL são instalados pelo Main.py após todas as tabelas serem criadas.
# 1. Cria a função PL/pgSQL que verifica se o estoque ficou abaixo do mínimo
criar_funcao_alerta_estoque = DDL(
    """
    CREATE OR REPLACE FUNCTION fn_verifica_estoque_baixo()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Se a quantidade atual ficou menor ou igual ao estoque mínimo e antes não era
        IF NEW.quantidade_estoque <= NEW.estoque_minimo AND OLD.quantidade_estoque > NEW.estoque_minimo THEN
            INSERT INTO alertas_estoque (
                produto_id,
                quantidade_no_momento,
                estoque_minimo,
                resolvido,
                created_at
            )
            VALUES (
                NEW.id,
                NEW.quantidade_estoque,
                NEW.estoque_minimo,
                0, -- 0 para não resolvido / pendente
                NOW()
            );
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """
)

# 2. Cria o trigger associado à tabela produtos
criar_trigger_alerta_estoque = DDL(
    """
    DROP TRIGGER IF EXISTS trg_verifica_estoque_baixo ON produtos;
    CREATE TRIGGER trg_verifica_estoque_baixo
    AFTER UPDATE OF quantidade_estoque ON produtos
    FOR EACH ROW
    EXECUTE FUNCTION fn_verifica_estoque_baixo();
    """
)

# Registra os eventos na tabela Produto
event.listen(Produto.__table__, 'after_create', criar_funcao_alerta_estoque)
event.listen(Produto.__table__, 'after_create', criar_trigger_alerta_estoque)

# 1. Cria a função para a auditoria
criar_funcao_auditoria = DDL(
    """
    CREATE OR REPLACE FUNCTION fn_audita_movimentacao()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO auditoria_movimentacoes (
            movimentacao_id,
            produto_id,
            tipo,
            quantidade_anterior,
            quantidade_nova,
            usuario,
            acao,
            data_acao
        )
        VALUES (
            NEW.id,
            NEW.produto_id,
            NEW.tipo::text, -- Converte o Enum do PG para texto, se necessário
            0, -- Ajuste conforme a lógica de estoque anterior do seu sistema
            NEW.quantidade,
            CURRENT_USER,
            'INSERT',
            NOW()
        );
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """
)

# 2. Cria o trigger associado à tabela movimentacoes
criar_trigger_auditoria = DDL(
    """
    DROP TRIGGER IF EXISTS trg_audita_movimentacao ON movimentacoes;
    CREATE TRIGGER trg_audita_movimentacao
    AFTER INSERT ON movimentacoes
    FOR EACH ROW
    EXECUTE FUNCTION fn_audita_movimentacao();
    """
)

# Registra os eventos na tabela Movimentacao
event.listen(Movimentacao.__table__, 'after_create', criar_funcao_auditoria)
event.listen(Movimentacao.__table__, 'after_create', criar_trigger_auditoria)

#Conexao
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://meu_usuario:minha_senha@localhost:5432/meu_banco"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()