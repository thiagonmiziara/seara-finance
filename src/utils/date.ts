import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formats an ISO date string into a Brazilian date format (dd/MM/yyyy).
 * Returns a fallback if the date is invalid or missing.
 */
export const formatDate = (dateString: string | undefined, formatStr: string = "dd/MM/yyyy") => {
    try {
        if (!dateString) return "--/--/----";
        return format(parseISO(dateString), formatStr, { locale: ptBR });
    } catch (e) {
        return "--/--/----";
    }
};
