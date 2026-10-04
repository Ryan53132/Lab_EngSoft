# Integração aplicada

## Alterações
- Implementadas as rotas FastAPI esperadas pelo `ApiProdutoRepository`.
- Implementado CRUD de produtos.
- Implementado cadastro/listagem de categorias.
- Implementado PATCH de estoque com registro de movimentação.
- Implementado criação/sincronização de lote e `data_validade`.
- Implementado endpoint de alertas de estoque.
- Adicionado CORS para o frontend local.
- Criado fornecedor padrão (id 1) e categorias padrão na inicialização.
- Corrigido `Lote.movimentacoes` para usar `back_populates="lote"`.
- Adicionados cascades ORM para exclusão de produtos.
- Movidos os triggers PostgreSQL para a inicialização após `create_all`, evitando referência a tabelas ainda não criadas.
- Trigger de estoque baixo cobre INSERT e UPDATE.
- Docker alterado para `VITE_USE_MOCK=false`.
- Adicionado `back/smoke_test_api.py`.

## Verificações
- `python -m py_compile Main.py DataBaseSchema.py`: OK.
- `python smoke_test_api.py`: OK.
- Build TypeScript: não foi possível concluir neste ambiente porque a instalação do npm excedeu o tempo disponível; o erro observado no `npm run build` foi consequência das dependências não instaladas, não de um erro TypeScript isolado.
- Docker Compose: não foi possível executar porque o ambiente de análise não possui Docker instalado.

## Importante
O ZIP contém a versão ajustada localmente. Ele não altera automaticamente o GitHub.
