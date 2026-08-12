🛒 Mini-Mercado: Sistema de Gestão de Estoque

Este projeto é um exercício focado na implementação de Design Patterns para manter o código desacoplado e escalável.

🎯 Objetivo

Desenvolver uma API (ou aplicação console) para controlar o estoque de um pequeno mercado, focando em:

    Regras de Desconto (baseadas na validade).

    Alertas (estoque baixo e vencimento).

    Gestão de Tipos de Produtos.

🛠 Requisitos Funcionais
1. Gestão de Produtos

    [ ] Cadastrar produtos (Nome, Preço, Data de Validade, Quantidade em Estoque).

    [ ] Diferenciar produtos por categoria (Hortifrúti, Industrializado, Limpeza).

    [ ] Design Pattern sugerido: Factory Method para instanciar as categorias.

2. Regras de Preço (Promoção)

    [ ] O sistema deve calcular o preço de venda automaticamente:

        Normal (Preço cheio).

        Desconto de Vencimento (Ex: faltam 2 dias para vencer = 50% de desconto).

        Desconto de Quantidade (Ex: comprou 10 unidades, ganha 10% de desconto).

    [ ] Design Pattern sugerido: Strategy para trocar as regras de cálculo.

3. Alertas e Notificações

    [ ] Quando um produto atingir o estoque mínimo, emitir um log de "Reposição Necessária".

    [ ] Quando um produto estiver a menos de 3 dias do vencimento, emitir um alerta de "Produto em Cartaz (Queima de Estoque)".

    [ ] Design Pattern sugerido: Observer para monitorar as alterações no estoque.