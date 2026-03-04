import { useAccount, AccountType } from '@/hooks/useAccount';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Briefcase, UserRound } from 'lucide-react';

export function AccountSwitcher() {
    const { accountType, setAccountType } = useAccount();

    return (
        <div className='flex items-center'>
            <Select
                value={accountType}
                onValueChange={(value) => setAccountType(value as AccountType)}
            >
                <SelectTrigger
                    className="w-[200px] min-w-[200px] box-border border border-input focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                >
                    <div className="flex items-center gap-2 truncate">
                        <SelectValue className="truncate" placeholder='Selecione a conta' />
                    </div>
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value='personal'>
                        <div className='flex items-center gap-2 h-5'>
                            <UserRound className='h-4 w-4 text-emerald-500' />
                            <span className='font-medium text-sm'>Pessoal</span>
                        </div>
                    </SelectItem>
                    <SelectItem value='business'>
                        <div className='flex items-center gap-2 h-5'>
                            <Briefcase className='h-4 w-4 text-amber-500' />
                            <span className='font-medium text-sm'>Empresarial (PJ)</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}