import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function TermsOfServiceDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <span className="underline hover:text-primary underline-offset-4 decoration-primary/30 hover:decoration-primary/100 transition-colors cursor-pointer">
                    Termos de Serviço
                </span>
            </DialogTrigger>
            <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Termos de Serviço - Seara Finance</DialogTitle>
                    <DialogDescription>
                        Última atualização: 10 de Fevereiro de 2026
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm text-foreground/80">
                    <p>
                        Bem-vindo ao Seara Finance. Ao acessar ou usar nosso sistema, você concorda em cumprir estes Termos de Serviço.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground">1. Uso do Sistema</h3>
                    <p>
                        O Seara Finance é uma ferramenta de gestão financeira destinada exclusivamente ao uso interno. O acesso é restrito a pessoal autorizado.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground">2. Responsabilidades do Usuário</h3>
                    <p>
                        Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades que ocorrem em sua conta. Notifique a administração imediatamente sobre qualquer uso não autorizado.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground">3. Privacidade e Dados</h3>
                    <p>
                        Seus dados são tratados com confidencialidade e utilizados apenas para fins de gestão financeira e administrativa da instituição, conforme detalhado em nossa Política de Privacidade.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground">4. Modificações</h3>
                    <p>
                        Reservamo-nos o direito de modificar estes termos a qualquer momento. O uso contínuo do sistema após tais alterações constitui sua aceitação dos novos termos.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function PrivacyPolicyDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <span className="underline hover:text-primary underline-offset-4 decoration-primary/30 hover:decoration-primary/100 transition-colors cursor-pointer">
                    Política de Privacidade
                </span>
            </DialogTrigger>
            <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Política de Privacidade - Seara Finance</DialogTitle>
                    <DialogDescription>
                        Como tratamos seus dados
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm text-foreground/80">
                    <p>
                        A sua privacidade é importante para nós. Esta política descreve como o Seara Finance coleta, usa e protege suas informações.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground">1. Coleta de Informações</h3>
                    <p>
                        Coletamos informações básicas de perfil (nome, email) fornecidas pelo seu provedor de autenticação (Google) e dados financeiros inseridos no sistema para fins de controle orçamentário.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground">2. Uso das Informações</h3>
                    <div className="space-y-4 text-sm text-foreground/80">
                        As as informações coletadas são usadas exclusivamente para:
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Fornecer acesso autenticado ao sistema;</li>
                            <li>Gerar relatórios financeiros e gerenciais;</li>
                            <li>Manter a segurança e integridade da plataforma.</li>
                        </ul>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground">3. Compartilhamento de Dados</h3>
                    <p>
                        Não compartilhamos suas informações pessoais com terceiros, exceto quando exigido por lei ou autoridade competente. Dados financeiros agregados podem ser utilizados pela administração para tomada de decisões.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground">4. Segurança</h3>
                    <p>
                        Empregamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração ou destruição.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
