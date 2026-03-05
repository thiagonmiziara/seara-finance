## ADDED Requirements

### Requirement: Marcar fatura mensal como paga

O sistema SHALL permitir ao usuário marcar todas as transações de um mês específico de um cartão como pagas, em lote, a partir da seção "Previsão de Fatura" no CardsView.

#### Scenario: Botão de pagamento visível por mês

- **WHEN** a seção "Previsão de Fatura" está expandida e há pelo menos um mês listado
- **THEN** cada linha de mês SHALL exibir um botão ou ícone para pagar aquela fatura

#### Scenario: Confirmação antes de pagar

- **WHEN** o usuário clica no botão de pagar de um mês
- **THEN** o sistema SHALL solicitar confirmação antes de executar (ex: botão muda para "Confirmar" ou aparece confirmação inline)

#### Scenario: Execução do pagamento em lote

- **WHEN** o usuário confirma o pagamento de um mês
- **THEN** o sistema SHALL atualizar o `status` de todas as transações daquele mês vinculadas ao cartão de `a_pagar` para `pago`, de forma atômica

#### Scenario: Fatura paga some da lista

- **WHEN** todas as transações de um mês são marcadas como pagas
- **THEN** aquele mês SHALL desaparecer da seção "Previsão de Fatura" automaticamente

#### Scenario: Limite do cartão liberado após pagamento

- **WHEN** transações de um mês são marcadas como pagas
- **THEN** o valor disponível do cartão SHALL refletir o limite liberado (por consequência do filtro de transações `a_pagar`)

#### Scenario: Feedback durante operação

- **WHEN** o pagamento em lote está sendo processado
- **THEN** o botão SHALL exibir estado de loading/disabled para evitar cliques duplicados
