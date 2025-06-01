import { DashboardDescription, DashboardHeader, DashboardLayout, DashboardTitle } from '@/components/layouts/DashboardLayout';
import type { NextPageWithLayout } from '../_app';
import { useState, type ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { PRODUCTS } from '@/data/mock';
import { ProductMenuCard } from '@/components/shared/product/ProductMenuCard';
import { ProductCatalogCard } from '@/components/shared/product/ProductCatalogCard';
import { api } from '@/utils/api';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertDialogCancel } from '@radix-ui/react-alert-dialog';
import { ProductForm } from '@/components/shared/product/ProductForm';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { productFormSchema, type ProductFormSchema } from '@/forms/product';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const ProductsPage: NextPageWithLayout = () => {
    const apiUtils = api.useUtils();

    const [isCreateProductAlertDialog, setIsCreateProductAlertDialog] = useState(false);

    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);
    const [productIdToEdit, setProductIdToEdit] = useState<string | null>(null);

    const { data: products, isLoading: productsIsLoading } = api.product.getProduct.useQuery({ categoryId: 'ALL' });

    const { mutate: createProduct } = api.product.createProduct.useMutation({
        onSuccess: async () => {
            await apiUtils.product.getProduct.invalidate();

            toast('Create Product Susscessfully');
            createProductForm.reset();
            setUploadedImageUrl(null);
            setIsCreateProductAlertDialog(false);
        },
    });

    const { mutate: editProduct } = api.product.updateProduct.useMutation({
        onSuccess: async () => {
            await apiUtils.product.getProduct.invalidate();

            toast('Update Product Susscessfully');
            editProductForm.reset();
            setUploadedImageUrl(null);
            setProductIdToEdit(null);
        },
    });

    const { mutate: deleteProduct } = api.product.deleteProduct.useMutation({
        onSuccess: async () => {
            await apiUtils.product.getProduct.invalidate();

            toast('Delete Product Susscessfully');
            setProductIdToDelete(null);
        },
    });

    const createProductForm = useForm<ProductFormSchema>({ resolver: zodResolver(productFormSchema) });
    const editProductForm = useForm<ProductFormSchema>({ resolver: zodResolver(productFormSchema) });

    const handleSubmitCreateProduct = (values: ProductFormSchema) => {
        if (!uploadedImageUrl) {
            toast('Image Is Required!');
            return;
        }

        createProduct({
            ...values,
            imageUrl: uploadedImageUrl,
        });
    };

    const handleSubmitEditProduct = (values: ProductFormSchema) => {
        if (!productIdToEdit) return;

        if (!uploadedImageUrl) {
            toast('Image Is Required!');
            return;
        }

        editProduct({ id: productIdToEdit, ...values, imageUrl: uploadedImageUrl });
    };

    const handleSubmitDeleteProduct = () => {
        if (!productIdToDelete) return;
        deleteProduct({ productId: productIdToDelete });
    };

    return (
        <>
            <DashboardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <DashboardTitle>Product Management</DashboardTitle>
                        <DashboardDescription>View, add, edit, and delete products in your inventory.</DashboardDescription>
                    </div>

                    <AlertDialog open={isCreateProductAlertDialog} onOpenChange={setIsCreateProductAlertDialog}>
                        <AlertDialogTrigger asChild>
                            <Button>Add New Product</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Add Product</AlertDialogTitle>
                            </AlertDialogHeader>

                            <Form {...createProductForm}>
                                <ProductForm onSubmit={handleSubmitCreateProduct} onChange={(imageUrl) => setUploadedImageUrl(imageUrl)} />
                            </Form>

                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={createProductForm.handleSubmit(handleSubmitCreateProduct)}>Create</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </DashboardHeader>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {productsIsLoading && <span>Loading...</span>}
                {products?.map((product) => (
                    <ProductCatalogCard
                        key={product.id}
                        name={product.name}
                        price={product.price}
                        image={product.imageUrl ?? ''}
                        category={product.category.name}
                        onEdit={() => {
                            editProductForm.reset({ ...product, categoryId: product.category.id });
                            setProductIdToEdit(product.id);
                        }}
                        onDelete={() => setProductIdToDelete(product.id)}
                    />
                ))}
            </div>

            <AlertDialog open={!!productIdToEdit} onOpenChange={(open) => !open && setProductIdToEdit(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Edit Category</AlertDialogTitle>
                    </AlertDialogHeader>

                    <Form {...editProductForm}>
                        <ProductForm onSubmit={handleSubmitEditProduct} onChange={(imageUrl) => setUploadedImageUrl(imageUrl)} />
                    </Form>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button onClick={editProductForm.handleSubmit(handleSubmitEditProduct)}>Edit Product</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!productIdToDelete} onOpenChange={(open) => !open && setProductIdToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>Are you sure you want to delete this product? This action cannot be undone.</AlertDialogDescription>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button variant="destructive" onClick={handleSubmitDeleteProduct}>
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

ProductsPage.getLayout = (page: ReactElement) => {
    return <DashboardLayout>{page}</DashboardLayout>;
};

export default ProductsPage;
