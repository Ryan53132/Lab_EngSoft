from enum import Enum as PyEnum
from datetime import datetime, timezone
from sqlalchemy import (
    create_engine, Column, Integer, String, Numeric, 
    ForeignKey, DateTime, Date, Enum, event, update, select, insert
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

Base = declarative_base()

class TipoMovimentacao(PyEnum):
    ENTRADA = "ENTRADA"
    SAIDA = "SAIDA"

class Categoria(Base):
    __tablename__ = 'categorias'

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False, unique=True)
    
    produtos = relationship("Produto", back_populates="categoria")

class Fornecedor(Base):
    __tablename__ = 'fornecedores'

    id = Column(Integer, primary_key=True)
    nome = Column(String(150), nullable=False)
    cnpj = Column(String(18), unique=True, nullable=True)

    lotes = relationship("Lote", back_populates="fornecedor")

class Produto(Base):
    __tablename__ = 'produtos'

    id = Column(Integer, primary_key=True)
    nome = Column(String(150), nullable=False)
    sku = Column(String(50), unique=True, nullable=False)
    categoria_id = Column(Integer, ForeignKey('categorias.id'), nullable=False)

    categoria = relationship("Categoria", back_populates="produtos")
    lotes = relationship("Lote", back_populates="produto")

class Lote(Base):
    __tablename__ = 'lotes'

    id = Column(Integer, primary_key=True)
    codigo_lote = Column(String(50), nullable=False)
    data_validade = Column(Date, nullable=False)
    quantidade_inicial = Column(Integer, nullable=False)
    quantidade_atual = Column(Integer, nullable=False)
    
    produto_id = Column(Integer, ForeignKey('produtos.id'), nullable=False)
    fornecedor_id = Column(Integer, ForeignKey('fornecedores.id'), nullable=False)

    produto = relationship("Produto", back_populates="lotes")
    fornecedor = relationship("Fornecedor", back_populates="lotes")
    movimentacoes = relationship("MovimentacaoEstoque", back_populates="lote")

class MovimentacaoEstoque(Base):
    __tablename__ = 'movimentacoes_estoque'

    id = Column(Integer, primary_key=True)
    tipo = Column(Enum(TipoMovimentacao), nullable=False)
    quantidade = Column(Integer, nullable=False)
    data_movimentacao = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    lote_id = Column(Integer, ForeignKey('lotes.id'), nullable=False)
    lote = relationship("Lote", back_populates="movimentacoes")

class LogMovimentacao(Base):
    __tablename__ = 'logs_movimentacao'

    id = Column(Integer, primary_key=True)
    lote_id = Column(Integer, ForeignKey('lotes.id'), nullable=False)
    tipo = Column(Enum(TipoMovimentacao), nullable=False)
    quantidade_movimentada = Column(Integer, nullable=False)
    quantidade_anterior = Column(Integer, nullable=False) 
    quantidade_posterior = Column(Integer, nullable=False) 
    data_log = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    lote = relationship("Lote")

# OBSERVER / EVENT LISTENER ÚNICO
@event.listens_for(MovimentacaoEstoque, 'before_insert')
def processar_movimentacao_e_gerar_log(mapper, connection, target):
    # 1. Consulta o saldo atual no banco
    query_lote = select(Lote.quantidade_atual).where(Lote.id == target.lote_id)
    qtd_anterior = connection.execute(query_lote).scalar()

    if qtd_anterior is None:
        raise ValueError(f"Lote com ID {target.lote_id} não encontrado.")

    # 2. Calcula novo saldo
    fator = target.quantidade if target.tipo == TipoMovimentacao.ENTRADA else -target.quantidade
    qtd_posterior = qtd_anterior + fator

    # 3. Validação de estoque mínimo
    if qtd_posterior < 0:
        raise ValueError(
            f"Estoque insuficiente no Lote {target.lote_id}. "
            f"Disponível: {qtd_anterior}, Tentativa de saída: {target.quantidade}"
        )

    # 4. Atualiza o saldo do Lote
    stmt_update_lote = (
        update(Lote.__table__)
        .where(Lote.id == target.lote_id)
        .values(quantidade_atual=qtd_posterior)
    )
    connection.execute(stmt_update_lote)

    # 5. Registra o Log de Auditoria
    stmt_insert_log = (
        insert(LogMovimentacao.__table__)
        .values(
            lote_id=target.lote_id,
            tipo=target.tipo,
            quantidade_movimentada=target.quantidade,
            quantidade_anterior=qtd_anterior,
            quantidade_posterior=qtd_posterior,
            data_log=datetime.now(timezone.utc)
        )
    )
    connection.execute(stmt_insert_log)