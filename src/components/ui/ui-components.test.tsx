import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from './button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './dropdown-menu';
import { Input } from './input';
import { Label } from './label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './select';
import { Skeleton } from './skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './table';

describe('UI components', () => {
  it('renders Button', () => {
    render(<Button>Acao</Button>);
    expect(screen.getByText('Acao')).toBeInTheDocument();
  });

  it('renders Card and sections', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Titulo</CardTitle>
          <CardDescription>Descricao</CardDescription>
        </CardHeader>
        <CardContent>Conteudo</CardContent>
        <CardFooter>Rodape</CardFooter>
      </Card>,
    );
    expect(screen.getByText('Titulo')).toBeInTheDocument();
    expect(screen.getByText('Descricao')).toBeInTheDocument();
    expect(screen.getByText('Conteudo')).toBeInTheDocument();
    expect(screen.getByText('Rodape')).toBeInTheDocument();
  });

  it('renders Dialog content when open', () => {
    render(
      <Dialog open>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog Description</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('Dialog Description')).toBeInTheDocument();
  });

  it('renders DropdownMenu content when open', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('renders Input and Label', () => {
    render(
      <div>
        <Label htmlFor='field'>Campo</Label>
        <Input id='field' />
      </div>,
    );
    expect(screen.getByLabelText('Campo')).toBeInTheDocument();
  });

  it('renders Select with items', () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue placeholder='Selecione' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='a'>A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders Skeleton', () => {
    render(<Skeleton data-testid='skeleton' />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders Table structure', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Coluna</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Valor</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText('Coluna')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
  });
});
