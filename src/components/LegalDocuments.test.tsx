import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TermsOfServiceDialog, PrivacyPolicyDialog } from './LegalDocuments';

describe('LegalDocuments', () => {
  describe('TermsOfServiceDialog', () => {
    it('renders the trigger text', () => {
      render(<TermsOfServiceDialog />);
      expect(screen.getByText('Termos de Serviço')).toBeInTheDocument();
    });

    it('opens dialog on click and shows content', () => {
      render(<TermsOfServiceDialog />);
      fireEvent.click(screen.getByText('Termos de Serviço'));

      expect(
        screen.getByText('Termos de Serviço - Mordomia Seara'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /O Mordomia Seara é uma ferramenta de gestão financeira destinada exclusivamente ao uso interno/i,
        ),
      ).toBeInTheDocument();
    });
  });

  describe('PrivacyPolicyDialog', () => {
    it('renders the trigger text', () => {
      render(<PrivacyPolicyDialog />);
      expect(screen.getByText('Política de Privacidade')).toBeInTheDocument();
    });

    it('opens dialog on click and shows content', () => {
      render(<PrivacyPolicyDialog />);
      fireEvent.click(screen.getByText('Política de Privacidade'));

      expect(
        screen.getByText('Política de Privacidade - Mordomia Seara'),
      ).toBeInTheDocument();
      expect(screen.getByText(/Como tratamos seus dados/)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Não compartilhamos suas informações pessoais com terceiros/,
        ),
      ).toBeInTheDocument();
    });
  });
});
