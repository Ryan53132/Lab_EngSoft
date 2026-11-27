
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from DataBaseSchema import Funcionario, get_db
from Security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    criar_access_token,
    verificar_senha,
    get_usuario_atual,
)


router = APIRouter(
    prefix="/auth",
    tags=["Autenticação"]
)


# =====================================================
# SCHEMAS
# =====================================================

class LoginRequest(BaseModel):
    email: str = Field(min_length=1, max_length=150)
    senha: str = Field(min_length=1)


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    telefone: str | None
    cpf: str
    cargo: str

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UsuarioResponse


# =====================================================
# LOGIN
# =====================================================

@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db)
):
    email = payload.email.strip().lower()

    funcionario = db.execute(
        select(Funcionario).where(
            Funcionario.email == email
        )
    ).scalar_one_or_none()

    if not funcionario or not verificar_senha(
        payload.senha,
        funcionario.senha_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos."
        )

    token = criar_access_token(funcionario)

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UsuarioResponse(
            id=funcionario.id,
            nome=funcionario.nome,
            email=funcionario.email,
            telefone=funcionario.telefone,
            cpf=funcionario.cpf,
            cargo=funcionario.cargo.value,
        )
    )


# =====================================================
# USUÁRIO AUTENTICADO
# =====================================================

@router.get("/me", response_model=UsuarioResponse)
def usuario_logado(
    usuario: Funcionario = Depends(get_usuario_atual)
):
    """
    Retorna os dados do funcionário identificado pelo JWT.
    """

    return UsuarioResponse(
        id=usuario.id,
        nome=usuario.nome,
        email=usuario.email,
        telefone=usuario.telefone,
        cpf=usuario.cpf,
        cargo=usuario.cargo.value,
    )
