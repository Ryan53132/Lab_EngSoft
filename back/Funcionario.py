
import re

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from DataBaseSchema import Cargo, Funcionario, get_db
from Security import verificar_admin, hash_senha


router = APIRouter(
    prefix="/funcionarios",
    tags=["Funcionários"]
)


# =====================================================
# SCHEMAS
# =====================================================

class FuncionarioCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=150)
    email: str = Field(min_length=5, max_length=150)
    telefone: str | None = Field(default=None, max_length=20)
    cpf: str = Field(min_length=11, max_length=14)
    senha: str = Field(min_length=8, max_length=128)
    cargo: Cargo = Cargo.FUNCIONARIO


class FuncionarioUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=150)
    email: str | None = Field(default=None, min_length=5, max_length=150)
    telefone: str | None = Field(default=None, max_length=20)
    cpf: str | None = Field(default=None, min_length=11, max_length=14)
    senha: str | None = Field(default=None, min_length=8, max_length=128)
    cargo: Cargo | None = None


class FuncionarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str
    telefone: str | None
    cpf: str
    cargo: Cargo


# =====================================================
# VALIDAÇÕES
# =====================================================

def normalizar_cpf(cpf: str) -> str:
    return re.sub(r"\D", "", cpf)


def validar_nome(nome: str) -> str:
    nome_limpo = nome.strip()
    if not nome_limpo:
        raise HTTPException(
            status_code=422,
            detail="Informe um nome válido."
        )
    return nome_limpo


def validar_telefone(telefone: str | None) -> str | None:
    if telefone is None or not telefone.strip():
        return None
    digitos = re.sub(r"\D", "", telefone)
    if len(digitos) not in (10, 11):
        raise HTTPException(
            status_code=422,
            detail="Informe um telefone válido com DDD (10 ou 11 dígitos)."
        )
    return digitos


def validar_email(email: str) -> str:
    email = email.strip().lower()

    padrao = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

    if not re.match(padrao, email):
        raise HTTPException(
            status_code=422,
            detail="Informe um email válido."
        )

    return email


def validar_cpf(cpf: str) -> str:
    cpf = normalizar_cpf(cpf)

    if len(cpf) != 11:
        raise HTTPException(
            status_code=422,
            detail="O CPF deve possuir 11 números."
        )

    return cpf


# =====================================================
# PROTEÇÃO DO ÚLTIMO ADMINISTRADOR
# =====================================================

def verificar_ultimo_admin(
    db: Session,
    funcionario: Funcionario
):
    if funcionario.cargo != Cargo.ADMIN:
        return

    total_admins = db.execute(
        select(func.count(Funcionario.id)).where(
            Funcionario.cargo == Cargo.ADMIN
        )
    ).scalar_one()

    if total_admins <= 1:
        raise HTTPException(
            status_code=409,
            detail="Não é possível remover ou rebaixar o último administrador."
        )


# =====================================================
# CADASTRAR FUNCIONÁRIO
# =====================================================

@router.post(
    "",
    response_model=FuncionarioOut,
    status_code=status.HTTP_201_CREATED
)
def criar_funcionario(
    payload: FuncionarioCreate,
    db: Session = Depends(get_db),
    admin: Funcionario = Depends(verificar_admin)
):
    nome = validar_nome(payload.nome)
    email = validar_email(payload.email)
    cpf = validar_cpf(payload.cpf)
    telefone = validar_telefone(payload.telefone)

    # Verifica se o email já existe
    existente_email = db.execute(
        select(Funcionario).where(
            Funcionario.email == email
        )
    ).scalar_one_or_none()

    if existente_email:
        raise HTTPException(
            status_code=409,
            detail="Este email já está cadastrado."
        )

    # Verifica se o CPF já existe
    existente_cpf = db.execute(
        select(Funcionario).where(
            Funcionario.cpf == cpf
        )
    ).scalar_one_or_none()

    if existente_cpf:
        raise HTTPException(
            status_code=409,
            detail="Este CPF já está cadastrado."
        )

    funcionario = Funcionario(
        nome=nome,
        email=email,
        telefone=telefone,
        cpf=cpf,
        cargo=payload.cargo,
        senha_hash=hash_senha(payload.senha)
    )

    try:
        db.add(funcionario)
        db.commit()
        db.refresh(funcionario)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Email ou CPF já cadastrado."
        )

    return funcionario


# =====================================================
# LISTAR FUNCIONÁRIOS
# =====================================================

@router.get(
    "",
    response_model=list[FuncionarioOut]
)
def listar_funcionarios(
    db: Session = Depends(get_db),
    admin: Funcionario = Depends(verificar_admin)
):
    funcionarios = db.execute(
        select(Funcionario).order_by(Funcionario.nome)
    ).scalars().all()

    return funcionarios


# =====================================================
# CONSULTAR FUNCIONÁRIO POR ID
# =====================================================

@router.get(
    "/{funcionario_id}",
    response_model=FuncionarioOut
)
def obter_funcionario(
    funcionario_id: int,
    db: Session = Depends(get_db),
    admin: Funcionario = Depends(verificar_admin)
):
    funcionario = db.get(Funcionario, funcionario_id)

    if not funcionario:
        raise HTTPException(
            status_code=404,
            detail="Funcionário não encontrado."
        )

    return funcionario


# =====================================================
# ATUALIZAR FUNCIONÁRIO
# =====================================================

@router.patch(
    "/{funcionario_id}",
    response_model=FuncionarioOut
)
def atualizar_funcionario(
    funcionario_id: int,
    payload: FuncionarioUpdate,
    db: Session = Depends(get_db),
    admin: Funcionario = Depends(verificar_admin)
):
    funcionario = db.get(Funcionario, funcionario_id)

    if not funcionario:
        raise HTTPException(
            status_code=404,
            detail="Funcionário não encontrado."
        )

    dados = payload.model_dump(exclude_unset=True)

    if not dados:
        raise HTTPException(
            status_code=400,
            detail="Nenhum dado foi informado para atualização."
        )

    # Verifica alteração de email
    if "email" in dados and dados["email"] is not None:
        dados["email"] = validar_email(dados["email"])

        existente = db.execute(
            select(Funcionario).where(
                Funcionario.email == dados["email"],
                Funcionario.id != funcionario_id
            )
        ).scalar_one_or_none()

        if existente:
            raise HTTPException(
                status_code=409,
                detail="Este email já está cadastrado."
            )

    # Verifica alteração de CPF
    if "cpf" in dados and dados["cpf"] is not None:
        dados["cpf"] = validar_cpf(dados["cpf"])

        existente = db.execute(
            select(Funcionario).where(
                Funcionario.cpf == dados["cpf"],
                Funcionario.id != funcionario_id
            )
        ).scalar_one_or_none()

        if existente:
            raise HTTPException(
                status_code=409,
                detail="Este CPF já está cadastrado."
            )

    # Protege o último administrador
    novo_cargo = dados.get("cargo")

    if novo_cargo is not None and novo_cargo != funcionario.cargo:
        if funcionario.cargo == Cargo.ADMIN:
            verificar_ultimo_admin(db, funcionario)

    # Nunca armazenar senha sem hash
    if "senha" in dados:
        senha = dados.pop("senha")

        if senha is not None:
            funcionario.senha_hash = hash_senha(senha)

    # Aplica as demais alterações
    for campo, valor in dados.items():
        if campo == "nome" and valor is not None:
            valor = validar_nome(valor)
        elif campo == "telefone":
            valor = validar_telefone(valor)

        setattr(funcionario, campo, valor)

    try:
        db.commit()
        db.refresh(funcionario)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Não foi possível atualizar. Email ou CPF já cadastrado."
        )

    return funcionario


# =====================================================
# EXCLUIR FUNCIONÁRIO
# =====================================================

@router.delete(
    "/{funcionario_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def excluir_funcionario(
    funcionario_id: int,
    db: Session = Depends(get_db),
    admin: Funcionario = Depends(verificar_admin)
):
    funcionario = db.get(Funcionario, funcionario_id)

    if not funcionario:
        raise HTTPException(
            status_code=404,
            detail="Funcionário não encontrado."
        )

    # Impede que o administrador exclua a própria conta
    if funcionario.id == admin.id:
        raise HTTPException(
            status_code=409,
            detail="Você não pode excluir sua própria conta."
        )

    verificar_ultimo_admin(db, funcionario)

    db.delete(funcionario)
    db.commit()

    return None
