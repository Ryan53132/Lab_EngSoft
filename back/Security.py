
import os
from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from DataBaseSchema import Cargo, Funcionario, get_db


# =====================================================
# CONFIGURAÇÕES
# =====================================================

SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "A variável de ambiente JWT_SECRET_KEY não foi configurada."
    )

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

if ALGORITHM != "HS256":
    raise RuntimeError("Algoritmo JWT não permitido.")

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_EXPIRE_MINUTES", "30")
)


# =====================================================
# HASH DE SENHAS
# =====================================================

password_hash = PasswordHash.recommended()


def hash_senha(senha: str) -> str:
    """
    Gera o hash seguro da senha utilizando Argon2.
    """
    return password_hash.hash(senha)


def verificar_senha(
    senha: str,
    senha_hash: str
) -> bool:
    """
    Compara a senha informada com o hash armazenado.
    """
    try:
        return password_hash.verify(senha, senha_hash)
    except (ValueError, TypeError):
        return False


# =====================================================
# JWT
# =====================================================

def criar_access_token(funcionario: Funcionario) -> str:
    """
    Gera um JWT contendo a identificação do funcionário.
    """

    agora = datetime.now(timezone.utc)

    expiracao = agora + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(funcionario.id),
        "iat": agora,
        "exp": expiracao,
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


# =====================================================
# AUTENTICAÇÃO
# =====================================================

bearer_scheme = HTTPBearer(auto_error=False)


def get_usuario_atual(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> Funcionario:
    """
    Valida o JWT e recupera o funcionário autenticado.
    """

    erro_autenticacao = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou sessão expirada.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise erro_autenticacao

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        funcionario_id = payload.get("sub")

        if funcionario_id is None:
            raise erro_autenticacao

        funcionario_id = int(funcionario_id)

    except (InvalidTokenError, ValueError, TypeError):
        raise erro_autenticacao

    funcionario = db.get(Funcionario, funcionario_id)

    if funcionario is None:
        raise erro_autenticacao

    return funcionario


# =====================================================
# AUTORIZAÇÃO
# =====================================================

def verificar_admin(
    usuario: Funcionario = Depends(get_usuario_atual)
) -> Funcionario:
    """
    Permite acesso somente para administradores.
    """

    if usuario.cargo != Cargo.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não possui permissão para acessar este recurso."
        )

    return usuario
