import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TermsOfServiceDialog, PrivacyPolicyDialog } from "./LegalDocuments";

describe("LegalDocuments", () => {
    describe("TermsOfServiceDialog", () => {
        it("renders the trigger text", () => {
            render(<TermsOfServiceDialog />);
            expect(screen.getByText("Termos de Serviço")).toBeInTheDocument();
        });

        it("opens dialog on click and shows content", () => {
            render(<TermsOfServiceDialog />);
            fireEvent.click(screen.getByText("Termos de Serviço"));

            expect(screen.getByText("Termos de Serviço - Seara Finance")).toBeInTheDocument();
            expect(screen.getByText(/O Seara Finance é uma ferramenta de gestão financeira destinada exclusivamente ao uso interno/)).toBeInTheDocument();
        });
    });

    describe("PrivacyPolicyDialog", () => {
        it("renders the trigger text", () => {
            render(<PrivacyPolicyDialog />);
            expect(screen.getByText("Política de Privacidade")).toBeInTheDocument();
        });

        it("opens dialog on click and shows content", () => {
            render(<PrivacyPolicyDialog />);
            fireEvent.click(screen.getByText("Política de Privacidade"));

            expect(screen.getByText("Política de Privacidade - Seara Finance")).toBeInTheDocument();
            expect(screen.getByText(/Como tratamos seus dados/)).toBeInTheDocument();
            expect(screen.getByText(/Não compartilhamos suas informações pessoais com terceiros/)).toBeInTheDocument();
        });
    });
});
