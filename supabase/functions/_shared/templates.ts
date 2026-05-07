// WhatsApp message templates. Adding a new template = add a key here.
//
// All variables are interpolated as `{{varName}}` from the payload jsonb that
// `send-whatsapp` enqueues into notifications_queue.

export type TemplateKey =
  | 'welcome_optin'
  | 'bill_reminder'
  | 'daily_spend_alert'
  | 'weekly_summary'
  | 'monthly_summary';

const templates: Record<TemplateKey, string> = {
  welcome_optin: `🎉 Oi {{first_name}}! Seu WhatsApp tá conectado.
A partir de agora você recebe lembretes de fatura, alertas de gasto e seu resumo mensal por aqui.
Pra parar a qualquer momento, responda *SAIR*.`,

  bill_reminder: `🔔 Oi {{first_name}}, sua fatura do {{card_name}} fecha em {{days_left}} dias.
Total atual: {{current_amount}}
Vencimento: {{due_date}}

Abra o app pra revisar: {{app_link}}

Pra parar de receber, responda *SAIR*.`,

  daily_spend_alert: `⚠️ Oi {{first_name}}, hoje você gastou {{spent_today}} — acima da sua média ({{average}}).
Categoria que mais pesou: {{top_category}}.

Veja onde foi: {{app_link}}`,

  weekly_summary: `📊 Resumo da semana, {{first_name}}:
Entradas: {{income}}
Saídas: {{expense}}
Saldo: {{balance}}

Top 3 categorias: {{top_categories}}.
Detalhes: {{app_link}}`,

  monthly_summary: `📅 Fechamento de {{month_name}}, {{first_name}}:
Entradas: {{income}}
Saídas: {{expense}}
Saldo: {{balance}}

Faturas dos cartões: {{cards_summary}}.
Veja o relatório: {{app_link}}`,
};

export function renderTemplate(
  key: TemplateKey,
  vars: Record<string, string | number | undefined>,
): string {
  const template = templates[key];
  if (!template) {
    throw new Error(`Template desconhecido: ${key}`);
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const value = vars[name];
    return value === undefined || value === null ? '' : String(value);
  });
}
