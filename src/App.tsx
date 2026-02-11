import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/components/Dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome, CheckCircle2 } from "lucide-react";
import logo from "/logo.png";
import { TermsOfServiceDialog, PrivacyPolicyDialog } from "@/components/LegalDocuments";

function App() {
    const { isAuthenticated, login, isLoggingIn } = useAuth();

    if (isAuthenticated) {
        return <Dashboard />;
    }

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-background text-foreground">
            {/* Background Layers */}
            <div className="absolute inset-0 flex">
                <div className="w-full lg:w-1/2 bg-zinc-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-green-600/20" />
                    <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
                </div>
                <div className="hidden lg:block lg:w-1/2 bg-background" />
            </div>

            {/* Content Layer */}
            <div className="relative z-20 flex min-h-screen flex-col lg:flex-row">

                {/* Watermark Logo - Top Center */}
                <div className="absolute -top-24 lg:-top-12 left-1/2 transform -translate-x-1/2 w-full max-w-4xl h-96 flex items-start justify-center pointer-events-none opacity-[0.05] lg:opacity-[0.15] z-0 px-4">
                    <img src={logo} alt="" className="h-full w-auto object-contain grayscale brightness-100 lg:brightness-200" fetchPriority="high" loading="eager" />
                </div>

                {/* Left Column - Hero/Marketing */}
                <div className="flex-1 flex flex-col justify-start pt-20 lg:pt-0 lg:justify-center p-8 lg:p-16 text-white relative z-10">

                    <div className="relative z-10 max-w-xl text-center lg:text-left animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="mb-8 flex items-center justify-center lg:justify-start gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20">
                                <span className="font-bold text-xl">SF</span>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-white/90">Seara Finance</h1>
                        </div>

                        <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                            Gerencie suas finanças com <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-500">sabedoria</span>.
                        </h2>

                        <p className="text-lg text-zinc-400 mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">
                            O Seara Finance ajuda você a organizar seus gastos e planejar o seu futuro financeiro com eficiência e clareza.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-zinc-300 max-w-md mx-auto lg:mx-0">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <span>Controle total de fluxo</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <span>Relatórios simplificados</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <span>Planejamento escolar</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <span>Segurança de dados</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Login Form */}
                <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative z-10">
                    <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-700 delay-150">
                        <Card className="border-none shadow-none lg:shadow-xl lg:border-border/50 bg-card/50 backdrop-blur-sm lg:bg-card">
                            <CardHeader className="text-center space-y-2 pb-6">
                                <CardTitle className="text-2xl font-bold tracking-tight">Bem-vindo de volta!</CardTitle>
                                <CardDescription className="text-base">
                                    Entre com sua conta institucional para acessar
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    className="w-full relative h-12 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border-zinc-200 dark:border-zinc-800"
                                    onClick={login}
                                    disabled={isLoggingIn}
                                >
                                    <Chrome className={`mr-3 h-5 w-5 ${isLoggingIn ? 'animate-spin' : ''}`} />
                                    {isLoggingIn ? "Entrando..." : "Continuar com Google"}
                                </Button>



                                <div className="text-center text-xs text-muted-foreground/80 mt-2 leading-5">
                                    Ao continuar, você concorda com nossos <br className="hidden sm:inline" />
                                    <TermsOfServiceDialog /> e <PrivacyPolicyDialog />.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
