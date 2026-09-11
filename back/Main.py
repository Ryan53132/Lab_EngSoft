from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from DataBaseSchema import Base, engine, get_db

app = FastAPI()

# Opcional: Cria as tabelas e triggers no banco assim que a API sobe
@app.on_event("startup")
def startup_db():
    # Cria todas as tabelas mapeadas pelo Base no Postgres
    Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root(db: Session = Depends(get_db)):
    return {"message": "Conexão com o PostgreSQL estabelecida com sucesso!"}

@app.get("/test")
def teste():
    return {"message": "Rota de teste funcionando!"}