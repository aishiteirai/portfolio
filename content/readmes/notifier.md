> Projeto interno e de código privado. Este resumo foi escrito para o portfólio e não traz detalhes de negócio nem da infraestrutura da empresa.

## O que é

Serviço de notificações por WhatsApp desenvolvido para uso interno na OIC. Ele recebe o pedido de envio de um aviso e cuida de montar e entregar a mensagem.

## Minha parte

Projetei e desenvolvi o serviço sozinho, da arquitetura ao deploy.

## Como foi pensado

- **Modular.** Cada tipo de aviso é um módulo. Um tipo novo entra sem alterar o fluxo principal.
- **Empacotado em Docker**, com o mesmo ambiente do desenvolvimento à produção.

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | Java |
| Framework | Spring Boot |
| Mensageria | WhatsApp API |
| Infra | Docker |
