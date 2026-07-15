// i18n.js — Translations (EN/PT), tr() helper, category & payment-method lookups
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── i18n ─────────────────────────────────────────────────
// On first launch, default to the device language (Portuguese phones → 'pt',
// everything else → 'en'). Once the user picks a language it's saved in ft_lang.
function detectLang() {
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
  return /^pt/i.test(nav) ? 'pt' : 'en';
}
let appLang = localStorage.getItem(KEYS.lang) || detectLang();
const LANG_LOCALE = { en: 'en-US', pt: 'pt-BR' };
function dateLocale() { return LANG_LOCALE[appLang] || 'en-US'; }

const I18N = {
  en: {
    app_name: 'Centa',
    running_balance: 'Running Balance', s_income: '↑ Income', s_expenses: '↓ Expenses', s_savings: '🏦 Savings',
    budget_overview: 'Budget Overview', recent_tx: 'Recent Transactions',
    add_transaction: 'Add Transaction', history: 'Transactions', plan: 'Plan', charts: 'Charts',
    type: 'Type', amount: 'Amount', category: 'Category', date: 'Date', notes_optional: 'Notes (optional)',
    t_expense: 'Expense', t_income: 'Income', t_savings: 'Savings', ph_note: 'Add a note…',
    view_calendar: '📅 Calendar', view_list: '≡ List',
    f_all: 'All', f_expenses: 'Expenses', f_income: 'Income', f_savings: 'Savings',
    cal_sun: 'Sun', cal_mon: 'Mon', cal_tue: 'Tue', cal_wed: 'Wed', cal_thu: 'Thu', cal_fri: 'Fri', cal_sat: 'Sat',
    pt_categories: 'Categories', pt_goals: 'Goals', pt_subs: 'Subs', pt_budgets: 'Budgets',
    cat_tab_expense: '💸 Expense', cat_tab_income: '💰 Income',
    add_category_btn: '+ Add category', new_goal_btn: '+ New goal', add_sub_btn: '+ Add subscription', add_budget_btn: '+ Add budget',
    chart_expenses: 'Expenses by Category', chart_savings: 'Savings Breakdown', chart_bar: 'Income vs Expenses vs Savings — Last 6 Months',
    chart_methods: 'Spending by Payment Method',
    edit_transaction: 'Edit Transaction', save_changes: 'Save Changes', cancel: 'Cancel',
    new_category: 'New category', new_goal: 'New goal', add_subscription_title: 'Add subscription', add_budget_title: 'Add budget',
    emoji: 'Emoji', name: 'Name', target_amount: 'Target Amount', monthly_amount: 'Monthly Amount', billing_day: 'Billing Day (1–31)', monthly_limit: 'Monthly Limit',
    edit: 'Edit', frequency: 'Frequency', freq_monthly: 'Monthly', freq_weekly: 'Weekly', freq_yearly: 'Yearly',
    day_of_week: 'Day of week', month_label: 'Month', day_of_month: 'Day of month (1–31)',
    weekly_amount: 'Weekly Amount', yearly_amount: 'Yearly Amount', edit_subscription_title: 'Edit subscription',
    ph_cat: 'Pet Care', ph_goal: 'Trip to Europe', ph_sub: 'Netflix',
    add_category: 'Add Category', create_goal: 'Create Goal', add_subscription: 'Add Subscription', set_budget: 'Set Budget',
    settings: 'Settings', about: 'About', currency: 'Currency', language: 'Language', done: 'Done', close: 'Close',
    export_dest: 'Export files', export_share: 'Share sheet', export_device: 'Save to device (choose folder)',
    export_note: 'Applies to CSV and backup exports.',
    second_currency: 'Also show in', second_off: 'Off',
    second_currency_note: "Shows your balance converted at today's rate. Needs internet to update.",
    theme: 'Theme', theme_light: 'Light', theme_dark: 'Dark', theme_system: 'System', accent: 'Accent',
    currency_note: "Changes how amounts are displayed. Your existing amounts aren't converted.",
    security: 'Security', app_lock: 'App lock (PIN)', change_pin: 'Change PIN',
    pin_note: "Don't forget your PIN — it can't be recovered.",
    pin_set_title: 'Set a 4-digit PIN', pin_confirm_title: 'Confirm your PIN', pin_current_title: 'Enter your current PIN', pin_enter_title: 'Enter your PIN',
    pin_mismatch: "PINs didn't match — try again",
    toast_pin_set: 'App lock enabled 🔒', toast_pin_changed: 'PIN changed ✓', toast_lock_off: 'App lock disabled',
    pro_title: 'Centa Pro', pro_get: 'Get Centa Pro', pro_manage: 'Centa Pro',
    pro_pitch: 'Centa is free, with no ads or tracking. Pro is a way to support development — with a few extras as a thank-you.',
    pro_unlocked: 'Pro unlocked — thank you! 💚', pro_cta: 'Support & unlock', pro_restore: 'Restore purchase',
    pro_cta_soon: 'Purchases arrive with the Play Store release 🙂', pro_soon_chip: 'Soon',
    toast_pro_thanks: 'Thank you for supporting Centa! 💚', toast_pro_fail: "Purchase didn't go through",
    toast_pro_restored: 'Purchase restored ✓', toast_pro_none: 'No purchase found on this account',
    pro_free_note: 'Everything you already use stays free, forever.',
    pro_f_themes_t: 'Premium accent colors', pro_f_themes_s: 'Ocean, Sunset, Grape & Sky',
    pro_f_drive_t: 'Auto-backup to Google Drive', pro_f_drive_s: 'Your own Drive — Centa still has no servers',
    pro_f_pdf_t: 'PDF monthly report', pro_f_pdf_s: 'A polished statement you can share',
    pro_f_csv_t: 'CSV import', pro_f_csv_s: 'Bring history from your bank or spreadsheet',
    pro_f_roll_t: 'Budget rollover', pro_f_roll_s: 'Unspent budget carries into next month',
    pro_f_review_t: 'Year in review', pro_f_review_s: 'Your money story, wrapped up yearly',
    pro_f_cards_t: 'Cards & payment methods', pro_f_cards_s: 'Tag each spend: card, PIX, cash',
    pt_methods: 'Cards', add_method_btn: '+ Add card / method', new_method: 'New card / method', edit_method: 'Edit card / method',
    method_kind: 'Type', method_brand: 'Brand (optional)', method_color: 'Color', save_method: 'Save',
    ph_method: 'Nubank', ph_brand: 'Visa', method_paid_with: 'Paid with', method_none: 'None',
    no_methods: 'No cards or methods yet — add one below.',
    methods_pro_blurb: 'Organize spending by card, PIX or cash. Metadata only — never card numbers.',
    confirm_del_method: 'Delete this card/method? Your transactions stay, just untagged.',
    profiles: 'Profiles', personal_profile: 'Personal', new_profile: 'New profile', profile_name: 'Profile name',
    add_profile: '+ Add profile', switch_profile: 'Switch', move_to_profile: 'Move to profile', duplicate: '⧉ Duplicate',
    confirm_del_profile: 'Delete profile "{name}" and all its data? This cannot be undone.',
    toast_profile_added: 'Profile added!',
    toast_method_added: 'Method added!', toast_method_saved: 'Method updated ✓', toast_enter_name: 'Enter a name',
    toast_pro_dev_on: 'Pro unlocked (dev) 🔓', toast_pro_dev_off: 'Pro locked (dev)',
    rollover_label: 'Roll over unused budget', carried: 'carried',
    toast_rollover_on: 'Budget rollover on 🔁', toast_rollover_off: 'Budget rollover off',
    about_text: 'Your money, your data — everything stays on your device. No accounts, no tracking.',
    drawer_data: 'Data', drawer_prefs: 'Preferences', export_csv: 'Export to CSV', export_backup: 'Export backup', import_backup: 'Import backup',
    nav_home: 'Home', nav_history: 'History', nav_plan: 'Plan', nav_charts: 'Charts',
    onb_sub: 'Your money, your data.<br>Everything stays on your device.',
    onb_f1_t: 'Add transactions instantly', onb_f1_s: 'Income, expenses & savings in one tap',
    onb_f2_t: 'Plan with goals & budgets', onb_f2_s: 'Set targets and track subscriptions',
    onb_f3_t: 'Visualize your money', onb_f3_s: 'Charts & spending insights every month',
    get_started: 'Get Started →',
    // dynamic
    toast_goal_created: 'Goal created!', toast_enter_target: 'Enter a target amount',
    toast_cat_added: 'Category added!', toast_tx_added: 'Transaction added!', toast_enter_valid: 'Enter a valid amount',
    toast_tx_updated: 'Transaction updated ✓', toast_sub_added: 'Subscription added! 💳', toast_sub_saved: 'Subscription updated ✓', toast_enter_amount: 'Enter an amount', toast_enter_day: 'Enter a valid day',
    toast_tx_duplicated: 'Transaction duplicated ✓', toast_tx_moved: 'Moved to {name} ✓',
    toast_no_export: 'No transactions to export', toast_backup_exported: 'Backup exported!',
    toast_backup_restored: 'Backup restored ✓', toast_invalid_backup: 'Invalid backup file', toast_restored: 'Restored ✓',
    confirm_archive: 'Archive "{name}"?', confirm_del_cat: 'Delete "{name}"? Transactions will be moved to "Other".', confirm_del_sub: 'Delete this subscription?',
    spending: 'Spending', tap_breakdown: 'Tap for breakdown ›', no_expenses: 'No expenses',
    no_expense_data: 'No expense data', no_savings_month: 'No savings this month',
    goals_label: 'Goals', no_goal_yet: 'No goal yet', tap_to_add: 'Tap to add ›', goal_progress: 'Goal progress', done_emoji: '🎉 done',
    total: 'Total', spending_insights: 'Spending Insights', spending_insights_pct: 'Spending Insights (% of income)', pct_of_income: '% of income',
    remaining: 'remaining', to_go: 'to go', goal_complete: '🎉 Congratulations! Goal complete!', archive_goal: 'Archive this goal ✓', archive: 'Archive ✓',
    carried_over: 'Carried Over', balance_from: 'Balance from {month}',
    subs_count: '{n} subscription{s}', per_mo: '/mo', day: 'Day', pause: '⏸ Pause', resume: '▶ Resume', delete: 'Delete',
    over_budget: 'Over budget!', pct_used: '{pct}% used', no_budgets: 'No budgets set yet.<br>Add one below.',
    no_custom_exp: 'No custom expense categories yet — add one below.', no_custom_inc: 'No custom income categories yet — add one below.',
    no_goals_yet: 'No goals yet — add one below.', no_subs: 'No subscriptions added yet', no_tx_month: 'No transactions this month', no_tx_found: 'No transactions found',
    search_tx: 'Search transactions…', search_results: '{n} result(s) across all months',
    no_budgets_set: 'No budgets set', no_transactions: 'No transactions', monthly_subscriptions: 'Monthly Subscriptions', all_budgeted: 'All categories have budgets',
    csv_date: 'Date', csv_type: 'Type', csv_category: 'Category', csv_amount: 'Amount', csv_notes: 'Notes',
    pdf_report: 'Export PDF report', pdf_title: 'Monthly report', pdf_generated: 'Generated on {date}',
    pdf_income: 'Income', pdf_expenses: 'Expenses', pdf_savings: 'Savings', pdf_net: 'Net balance',
    pdf_by_category: 'Expenses by category', pdf_budgets: 'Budgets', pdf_goals: 'Goals', pdf_methods: 'Spending by payment method', pdf_transactions: 'Transactions',
    pdf_date: 'Date', pdf_category: 'Category', pdf_note: 'Note', pdf_amount: 'Amount',
    pdf_footer: 'Generated by Centa — your data stays on your device',
    toast_pdf_done: 'PDF report exported!',
    import_csv: 'Import from CSV',
    csv_import_title: 'Import from CSV', csv_import_sub: "Match your file's columns, then review the preview below.",
    csv_has_header: 'First row is a header', csv_col_date: 'Date column', csv_col_amount: 'Amount column', csv_col_desc: 'Description column',
    csv_date_format: 'Date format', csv_fmt_auto: 'Auto-detect',
    csv_neg_expense: 'Negative amounts are expenses', csv_cat_expense: 'Category for expenses', csv_cat_income: 'Category for income',
    csv_preview: 'Preview', csv_do_import: 'Import', csv_column: 'Column {n}',
    csv_summary: '{ok} to import · {skip} skipped', csv_summary_dupes: '{ok} to import · {dup} duplicates · {skip} unreadable',
    csv_none_readable: 'No readable rows — check your column choices',
    csv_all_dupes: 'All these rows are already in Centa',
    toast_csv_empty: 'That file looks empty', toast_csv_none: 'Nothing to import',
    toast_csv_done_one: '1 transaction imported ✓', toast_csv_done: '{n} transactions imported ✓',
    toast_csv_done_dupes: '{n} imported · {d} duplicates skipped ✓',
    review_title: 'Year in Review', review_share: 'Share', review_wrapped: 'YEAR IN REVIEW',
    review_earned: 'Earned', review_spent: 'Spent', review_saved: 'Saved', review_net: 'Net',
    review_rate: 'You set aside {pct}% of what you earned',
    review_top_cats: 'TOP CATEGORIES', review_monthly: 'MONTHLY SPENDING',
    review_biggest: 'Biggest month: {month}', review_txcount: '{n} transactions logged',
    review_footer: 'Made with Centa', review_empty: 'Nothing logged in {year} yet',
    toast_review_shared: 'Summary image ready to share!', toast_review_fail: "Couldn't create the image",
    drive_title: 'Google Drive backup',
    drive_desc: "Backups go to a private app folder in your own Google Drive. Centa has no servers and can't see your data.",
    drive_auto: 'Auto-backup after changes', drive_backup_now: 'Back up now', drive_restore: 'Restore from Drive',
    drive_last: 'Last backup: {when}', drive_never: 'No backup yet',
    drive_confirm_restore: 'Replace all current data with the backup from Google Drive?',
    toast_drive_done: 'Backed up to Drive ✓', toast_drive_fail: "Couldn't reach Google Drive", toast_drive_none: 'No backup found on Drive',
  },
  pt: {
    app_name: 'Centa',
    running_balance: 'Saldo Total', s_income: '↑ Receita', s_expenses: '↓ Despesas', s_savings: '🏦 Poupança',
    budget_overview: 'Visão Geral do Orçamento', recent_tx: 'Transações Recentes',
    add_transaction: 'Adicionar Transação', history: 'Histórico', plan: 'Plano', charts: 'Gráficos',
    type: 'Tipo', amount: 'Valor', category: 'Categoria', date: 'Data', notes_optional: 'Observações (opcional)',
    t_expense: 'Despesa', t_income: 'Receita', t_savings: 'Poupança', ph_note: 'Adicionar uma observação…',
    view_calendar: '📅 Calendário', view_list: '≡ Lista',
    f_all: 'Todos', f_expenses: 'Despesas', f_income: 'Receitas', f_savings: 'Poupança',
    cal_sun: 'Dom', cal_mon: 'Seg', cal_tue: 'Ter', cal_wed: 'Qua', cal_thu: 'Qui', cal_fri: 'Sex', cal_sat: 'Sáb',
    pt_categories: 'Categorias', pt_goals: 'Metas', pt_subs: 'Assinaturas', pt_budgets: 'Orçamentos',
    cat_tab_expense: '💸 Despesa', cat_tab_income: '💰 Receita',
    add_category_btn: '+ Adicionar categoria', new_goal_btn: '+ Nova meta', add_sub_btn: '+ Adicionar assinatura', add_budget_btn: '+ Adicionar orçamento',
    chart_expenses: 'Despesas por Categoria', chart_savings: 'Distribuição da Poupança', chart_bar: 'Receita vs Despesas vs Poupança — Últimos 6 Meses',
    chart_methods: 'Gastos por Forma de Pagamento',
    edit_transaction: 'Editar Transação', save_changes: 'Salvar Alterações', cancel: 'Cancelar',
    new_category: 'Nova categoria', new_goal: 'Nova meta', add_subscription_title: 'Adicionar assinatura', add_budget_title: 'Adicionar orçamento',
    emoji: 'Emoji', name: 'Nome', target_amount: 'Valor Alvo', monthly_amount: 'Valor Mensal', billing_day: 'Dia de Cobrança (1–31)', monthly_limit: 'Limite Mensal',
    edit: 'Editar', frequency: 'Frequência', freq_monthly: 'Mensal', freq_weekly: 'Semanal', freq_yearly: 'Anual',
    day_of_week: 'Dia da semana', month_label: 'Mês', day_of_month: 'Dia do mês (1–31)',
    weekly_amount: 'Valor Semanal', yearly_amount: 'Valor Anual', edit_subscription_title: 'Editar assinatura',
    ph_cat: 'Cuidados com Pet', ph_goal: 'Viagem à Europa', ph_sub: 'Netflix',
    add_category: 'Adicionar Categoria', create_goal: 'Criar Meta', add_subscription: 'Adicionar Assinatura', set_budget: 'Definir Orçamento',
    settings: 'Configurações', about: 'Sobre', currency: 'Moeda', language: 'Idioma', done: 'Concluído', close: 'Fechar',
    export_dest: 'Exportar arquivos', export_share: 'Menu de compartilhamento', export_device: 'Salvar no dispositivo (escolher pasta)',
    export_note: 'Vale para exportações de CSV e backup.',
    second_currency: 'Mostrar também em', second_off: 'Desativado',
    second_currency_note: 'Mostra seu saldo convertido pela cotação de hoje. Precisa de internet para atualizar.',
    theme: 'Tema', theme_light: 'Claro', theme_dark: 'Escuro', theme_system: 'Sistema', accent: 'Cor de destaque',
    currency_note: 'Altera como os valores são exibidos. Seus valores não são convertidos.',
    security: 'Segurança', app_lock: 'Bloqueio do app (PIN)', change_pin: 'Alterar PIN',
    pin_note: 'Não esqueça seu PIN — ele não pode ser recuperado.',
    pin_set_title: 'Defina um PIN de 4 dígitos', pin_confirm_title: 'Confirme seu PIN', pin_current_title: 'Digite seu PIN atual', pin_enter_title: 'Digite seu PIN',
    pin_mismatch: 'Os PINs não coincidem — tente novamente',
    toast_pin_set: 'Bloqueio ativado 🔒', toast_pin_changed: 'PIN alterado ✓', toast_lock_off: 'Bloqueio desativado',
    pro_title: 'Centa Pro', pro_get: 'Conheça o Centa Pro', pro_manage: 'Centa Pro',
    pro_pitch: 'O Centa é gratuito, sem anúncios e sem rastreamento. O Pro é uma forma de apoiar o desenvolvimento — com alguns extras de agradecimento.',
    pro_unlocked: 'Pro desbloqueado — obrigado! 💚', pro_cta: 'Apoiar e desbloquear', pro_restore: 'Restaurar compra',
    pro_cta_soon: 'As compras chegam com o lançamento na Play Store 🙂', pro_soon_chip: 'Em breve',
    toast_pro_thanks: 'Obrigado por apoiar o Centa! 💚', toast_pro_fail: 'A compra não foi concluída',
    toast_pro_restored: 'Compra restaurada ✓', toast_pro_none: 'Nenhuma compra encontrada nesta conta',
    pro_free_note: 'Tudo o que você já usa continua gratuito, para sempre.',
    pro_f_themes_t: 'Cores premium', pro_f_themes_s: 'Oceano, Pôr do sol, Uva e Céu',
    pro_f_drive_t: 'Backup automático no Google Drive', pro_f_drive_s: 'No seu próprio Drive — o Centa continua sem servidores',
    pro_f_pdf_t: 'Relatório mensal em PDF', pro_f_pdf_s: 'Um extrato caprichado para compartilhar',
    pro_f_csv_t: 'Importar CSV', pro_f_csv_s: 'Traga o histórico do seu banco ou planilha',
    pro_f_roll_t: 'Orçamento acumulativo', pro_f_roll_s: 'O que sobrar do orçamento passa para o próximo mês',
    pro_f_review_t: 'Retrospectiva do ano', pro_f_review_s: 'A história do seu dinheiro, todo ano',
    pro_f_cards_t: 'Cartões e formas de pagamento', pro_f_cards_s: 'Marque cada gasto: cartão, PIX, dinheiro',
    pt_methods: 'Cartões', add_method_btn: '+ Adicionar cartão / método', new_method: 'Novo cartão / método', edit_method: 'Editar cartão / método',
    method_kind: 'Tipo', method_brand: 'Bandeira (opcional)', method_color: 'Cor', save_method: 'Salvar',
    ph_method: 'Nubank', ph_brand: 'Visa', method_paid_with: 'Pago com', method_none: 'Nenhum',
    no_methods: 'Nenhum cartão ou método ainda — adicione um abaixo.',
    methods_pro_blurb: 'Organize os gastos por cartão, PIX ou dinheiro. Só metadados — nunca números de cartão.',
    confirm_del_method: 'Excluir este cartão/método? Suas transações permanecem, apenas sem marcação.',
    profiles: 'Perfis', personal_profile: 'Pessoal', new_profile: 'Novo perfil', profile_name: 'Nome do perfil',
    add_profile: '+ Adicionar perfil', switch_profile: 'Trocar', move_to_profile: 'Mover para perfil', duplicate: '⧉ Duplicar',
    confirm_del_profile: 'Excluir o perfil "{name}" e todos os seus dados? Isso não pode ser desfeito.',
    toast_profile_added: 'Perfil adicionado!',
    toast_method_added: 'Método adicionado!', toast_method_saved: 'Método atualizado ✓', toast_enter_name: 'Digite um nome',
    toast_pro_dev_on: 'Pro desbloqueado (dev) 🔓', toast_pro_dev_off: 'Pro bloqueado (dev)',
    rollover_label: 'Acumular orçamento não usado', carried: 'acumulado',
    toast_rollover_on: 'Acúmulo de orçamento ativado 🔁', toast_rollover_off: 'Acúmulo de orçamento desativado',
    about_text: 'Seu dinheiro, seus dados — tudo fica no seu dispositivo. Sem contas, sem rastreamento.',
    drawer_data: 'Dados', drawer_prefs: 'Preferências', export_csv: 'Exportar CSV', export_backup: 'Exportar backup', import_backup: 'Importar backup',
    nav_home: 'Início', nav_history: 'Histórico', nav_plan: 'Plano', nav_charts: 'Gráficos',
    onb_sub: 'Seu dinheiro, seus dados.<br>Tudo fica no seu dispositivo.',
    onb_f1_t: 'Adicione transações na hora', onb_f1_s: 'Receitas, despesas e poupança num toque',
    onb_f2_t: 'Planeje com metas e orçamentos', onb_f2_s: 'Defina objetivos e controle assinaturas',
    onb_f3_t: 'Visualize seu dinheiro', onb_f3_s: 'Gráficos e análises todo mês',
    get_started: 'Começar →',
    // dynamic
    toast_goal_created: 'Meta criada!', toast_enter_target: 'Insira um valor alvo',
    toast_cat_added: 'Categoria adicionada!', toast_tx_added: 'Transação adicionada!', toast_enter_valid: 'Insira um valor válido',
    toast_tx_updated: 'Transação atualizada ✓', toast_sub_added: 'Assinatura adicionada! 💳', toast_sub_saved: 'Assinatura atualizada ✓', toast_enter_amount: 'Informe o valor', toast_enter_day: 'Informe um dia válido',
    toast_tx_duplicated: 'Transação duplicada ✓', toast_tx_moved: 'Movida para {name} ✓',
    toast_no_export: 'Nenhuma transação para exportar', toast_backup_exported: 'Backup exportado!',
    toast_backup_restored: 'Backup restaurado ✓', toast_invalid_backup: 'Arquivo de backup inválido', toast_restored: 'Restaurado ✓',
    confirm_archive: 'Arquivar "{name}"?', confirm_del_cat: 'Excluir "{name}"? As transações serão movidas para "Outros".', confirm_del_sub: 'Excluir esta assinatura?',
    spending: 'Gastos', tap_breakdown: 'Toque para detalhes ›', no_expenses: 'Sem despesas',
    no_expense_data: 'Sem dados de despesas', no_savings_month: 'Sem poupança neste mês',
    goals_label: 'Metas', no_goal_yet: 'Nenhuma meta ainda', tap_to_add: 'Toque para adicionar ›', goal_progress: 'Progresso da meta', done_emoji: '🎉 concluída',
    total: 'Total', spending_insights: 'Análise de Gastos', spending_insights_pct: 'Análise de Gastos (% da renda)', pct_of_income: '% da renda',
    remaining: 'restante', to_go: 'faltam', goal_complete: '🎉 Parabéns! Meta concluída!', archive_goal: 'Arquivar esta meta ✓', archive: 'Arquivar ✓',
    carried_over: 'Saldo Anterior', balance_from: 'Saldo de {month}',
    subs_count: '{n} assinatura{s}', per_mo: '/mês', day: 'Dia', pause: '⏸ Pausar', resume: '▶ Retomar', delete: 'Excluir',
    over_budget: 'Orçamento estourado!', pct_used: '{pct}% utilizado', no_budgets: 'Nenhum orçamento definido.<br>Adicione um abaixo.',
    no_custom_exp: 'Nenhuma categoria de despesa personalizada — adicione uma abaixo.', no_custom_inc: 'Nenhuma categoria de receita personalizada — adicione uma abaixo.',
    no_goals_yet: 'Nenhuma meta ainda — adicione uma abaixo.', no_subs: 'Nenhuma assinatura adicionada', no_tx_month: 'Nenhuma transação neste mês', no_tx_found: 'Nenhuma transação encontrada',
    search_tx: 'Buscar transações…', search_results: '{n} resultado(s) em todos os meses',
    no_budgets_set: 'Nenhum orçamento definido', no_transactions: 'Nenhuma transação', monthly_subscriptions: 'Assinaturas Mensais', all_budgeted: 'Todas as categorias têm orçamento',
    csv_date: 'Data', csv_type: 'Tipo', csv_category: 'Categoria', csv_amount: 'Valor', csv_notes: 'Observações',
    pdf_report: 'Exportar relatório PDF', pdf_title: 'Relatório mensal', pdf_generated: 'Gerado em {date}',
    pdf_income: 'Receitas', pdf_expenses: 'Despesas', pdf_savings: 'Poupança', pdf_net: 'Saldo do mês',
    pdf_by_category: 'Despesas por categoria', pdf_budgets: 'Orçamentos', pdf_goals: 'Metas', pdf_methods: 'Gastos por forma de pagamento', pdf_transactions: 'Transações',
    pdf_date: 'Data', pdf_category: 'Categoria', pdf_note: 'Observação', pdf_amount: 'Valor',
    pdf_footer: 'Gerado pelo Centa — seus dados ficam no seu dispositivo',
    toast_pdf_done: 'Relatório PDF exportado!',
    import_csv: 'Importar de CSV',
    csv_import_title: 'Importar de CSV', csv_import_sub: 'Escolha as colunas do seu arquivo e confira a prévia abaixo.',
    csv_has_header: 'A primeira linha é um cabeçalho', csv_col_date: 'Coluna da data', csv_col_amount: 'Coluna do valor', csv_col_desc: 'Coluna da descrição',
    csv_date_format: 'Formato da data', csv_fmt_auto: 'Detectar automaticamente',
    csv_neg_expense: 'Valores negativos são despesas', csv_cat_expense: 'Categoria para despesas', csv_cat_income: 'Categoria para receitas',
    csv_preview: 'Prévia', csv_do_import: 'Importar', csv_column: 'Coluna {n}',
    csv_summary: '{ok} para importar · {skip} ignoradas', csv_summary_dupes: '{ok} para importar · {dup} duplicadas · {skip} ilegíveis',
    csv_none_readable: 'Nenhuma linha legível — confira as colunas escolhidas',
    csv_all_dupes: 'Todas essas linhas já estão no Centa',
    toast_csv_empty: 'Esse arquivo parece vazio', toast_csv_none: 'Nada para importar',
    toast_csv_done_one: '1 transação importada ✓', toast_csv_done: '{n} transações importadas ✓',
    toast_csv_done_dupes: '{n} importadas · {d} duplicadas ignoradas ✓',
    review_title: 'Retrospectiva do Ano', review_share: 'Compartilhar', review_wrapped: 'RETROSPECTIVA DO ANO',
    review_earned: 'Recebido', review_spent: 'Gasto', review_saved: 'Poupado', review_net: 'Saldo',
    review_rate: 'Você guardou {pct}% do que recebeu',
    review_top_cats: 'PRINCIPAIS CATEGORIAS', review_monthly: 'GASTOS POR MÊS',
    review_biggest: 'Maior mês: {month}', review_txcount: '{n} transações registradas',
    review_footer: 'Feito com o Centa', review_empty: 'Nada registrado em {year} ainda',
    toast_review_shared: 'Imagem pronta para compartilhar!', toast_review_fail: 'Não foi possível criar a imagem',
    drive_title: 'Backup no Google Drive',
    drive_desc: 'Os backups vão para uma pasta privada do app no seu próprio Google Drive. O Centa não tem servidores e não vê seus dados.',
    drive_auto: 'Backup automático após alterações', drive_backup_now: 'Fazer backup agora', drive_restore: 'Restaurar do Drive',
    drive_last: 'Último backup: {when}', drive_never: 'Nenhum backup ainda',
    drive_confirm_restore: 'Substituir todos os dados atuais pelo backup do Google Drive?',
    toast_drive_done: 'Backup salvo no Drive ✓', toast_drive_fail: 'Não foi possível acessar o Google Drive', toast_drive_none: 'Nenhum backup encontrado no Drive',
  },
};

// Built-in category labels per language (custom categories keep the user's text).
const CAT_LABELS = {
  en: { food:'Food & Dining', housing:'Housing & Rent', transport:'Transport', entertainment:'Entertainment', healthcare:'Healthcare', shopping:'Shopping', utilities:'Utilities', education:'Education', other:'Other', salary:'Salary', freelance:'Freelance', gift:'Gift', other_inc:'Other', invest:'Investments', emergency:'Emergency Fund', retire:'Retirement', gen_save:'General Savings' },
  pt: { food:'Alimentação', housing:'Moradia e Aluguel', transport:'Transporte', entertainment:'Entretenimento', healthcare:'Saúde', shopping:'Compras', utilities:'Contas e Serviços', education:'Educação', other:'Outros', salary:'Salário', freelance:'Freelance', gift:'Presente', other_inc:'Outros', invest:'Investimentos', emergency:'Reserva de Emergência', retire:'Aposentadoria', gen_save:'Poupança Geral' },
};

function tr(key, vars) {
  const dict = I18N[appLang] || I18N.en;
  let s = (key in dict) ? dict[key] : (I18N.en[key] != null ? I18N.en[key] : key);
  if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
  return s;
}

function applyStaticI18n() {
  document.documentElement.lang = appLang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = tr(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = tr(el.dataset.i18nPh); });
}

function setLang(code) {
  appLang = code;
  localStorage.setItem(KEYS.lang, code);
  const ls = document.getElementById('setting-language');
  if (ls) ls.value = code;
  applyStaticI18n();
  buildCategorySelect(addType);  // Add-page category dropdown
  rebuildRecCategory();          // Subscription category dropdown
  renderBudgets();               // Plan lists + budget-category dropdown
  renderDashboard();
  renderPage(currentPage);
}

function allCats(type) {
  // Built-in labels are translated per language; custom categories keep the user's text.
  const base   = (CATEGORIES[type] || []).map(c => ({ id: c.id, emoji: c.emoji, label: (CAT_LABELS[appLang] && CAT_LABELS[appLang][c.id]) || c.label }));
  const custom = (state.customCategories && state.customCategories[type]) || [];
  return [...base, ...custom];
}

function catInfo(id) {
  const found = [...CATEGORIES.expense, ...CATEGORIES.income, ...CATEGORIES.savings].find(c => c.id === id);
  if (found) return { emoji: found.emoji, label: (CAT_LABELS[appLang] && CAT_LABELS[appLang][id]) || found.label };
  for (const type of ['expense', 'income']) {
    const c = (state.customCategories[type] || []).find(c => c.id === id);
    if (c) return c;
  }
  const goal = state.goals.find(g => g.id === id);
  if (goal) return { label: goal.name, emoji: goal.emoji || '🎯' };
  return { label: id, emoji: '💸' };
}


