import { LoginForm } from "@/components/auth/login-form"
import { Suspense } from "react";

const LoginPage = () => {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Cargando...</div>}>
            <LoginForm />
        </Suspense>
    );
};

export default LoginPage;
