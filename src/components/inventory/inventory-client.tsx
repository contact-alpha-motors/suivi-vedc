'use client';

import { useState, useMemo } from 'react';
import type { Item } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  addItem,
  updateItem,
  deleteItem as deleteItemAction,
} from '@/lib/data';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';


export default function InventoryClient() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const itemsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'inventoryItems') : null),
    [firestore, user]
  );
  const { data: items, isLoading: itemsLoading } = useCollection<Item>(itemsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = (item: Item | null) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItemAction(id);
      toast({
        title: 'Succès',
        description: "L'article a été supprimé.",
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer l\'article.',
      });
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries()) as any;
    
    const itemData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        initialQuantity: parseInt(data.initialQuantity, 10),
        currentQuantity: editingItem ? editingItem.currentQuantity : parseInt(data.initialQuantity, 10),
        lowStockThreshold: parseInt(data.lowStockThreshold, 10)
    };

    try {
      if (editingItem) {
        await updateItem({ ...itemData, id: editingItem.id });
        toast({ title: 'Succès', description: 'Article mis à jour.' });
      } else {
        await addItem(itemData);
        toast({ title: 'Succès', description: 'Article ajouté.' });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder l\'article.',
      });
    }
  };
  
  const isLoading = isUserLoading || itemsLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Gestion du Stock</CardTitle>
              <CardDescription>
                Ajoutez, modifiez ou supprimez des articles de votre inventaire.
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog(null)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un article
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="text-right">Stock Actuel</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-sm truncate">{item.description}</TableCell>
                  <TableCell className="text-right">
                    {item.price.toLocaleString('fr-CM', {
                      style: 'currency',
                      currency: 'XAF',
                    })}
                  </TableCell>
                  <TableCell className="text-right">{item.currentQuantity}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(item)}>
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Modifier l\'article' : 'Ajouter un nouvel article'}
              </DialogTitle>
              <DialogDescription>
                Remplissez les détails de l'article ci-dessous.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nom</Label>
                <Input id="name" name="name" defaultValue={editingItem?.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingItem?.description} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">Prix (FCFA)</Label>
                <Input id="price" name="price" type="number" step="0.01" defaultValue={editingItem?.price} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="initialQuantity" className="text-right">Quantité initiale</Label>
                <Input id="initialQuantity" name="initialQuantity" type="number" defaultValue={editingItem?.initialQuantity} className="col-span-3" disabled={!!editingItem} required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lowStockThreshold" className="text-right">Seuil d'alerte</Label>
                <Input id="lowStockThreshold" name="lowStockThreshold" type="number" defaultValue={editingItem?.lowStockThreshold ?? 5} className="col-span-3" required />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Annuler</Button>
              </DialogClose>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
