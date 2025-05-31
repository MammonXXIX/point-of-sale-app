import { DashboardDescription, DashboardHeader, DashboardLayout, DashboardTitle } from '@/components/layouts/DashboardLayout';
import { CategoryCatalogCard } from '@/components/shared/category/CategoryCatalogCard';
import { CategoryForm } from '@/components/shared/category/CategoryForm';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { categoryFormSchema, type CategoryFormSchema } from '@/forms/category';
import { api } from '@/utils/api';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { NextPageWithLayout } from '../_app';

const CategoriesPage: NextPageWithLayout = () => {
    const apiUtils = api.useUtils();

    const [isCreateCategoryAlertDialogOpen, setIsCreateCategoryAlertDialogOpen] = useState(false);

    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [categoryToEdit, setCategoryToEdit] = useState<string | null>(null);

    const createCategoryForm = useForm<CategoryFormSchema>({ resolver: zodResolver(categoryFormSchema) });
    const editCategoryForm = useForm<CategoryFormSchema>({ resolver: zodResolver(categoryFormSchema) });

    const { data: categories, isLoading: categoriesIsLoading } = api.category.getCategories.useQuery();

    const { mutate: createCategory } = api.category.createCategory.useMutation({
        onSuccess: async () => {
            await apiUtils.category.getCategories.invalidate();

            toast('Edit Category Succesfully!');
            createCategoryForm.reset();
            setIsCreateCategoryAlertDialogOpen(false);
        },
    });

    const { mutate: editCategory } = api.category.editCategory.useMutation({
        onSuccess: async () => {
            await apiUtils.category.getCategories.invalidate();

            toast('Update Category Succesfully!');
            setCategoryToEdit(null);
        },
    });

    const { mutate: deleteCategory } = api.category.deleteCategoryById.useMutation({
        onSuccess: async () => {
            await apiUtils.category.getCategories.invalidate();

            toast('Delete Category Succesfully!');
            setCategoryToDelete(null);
        },
    });

    const handleSubmitCreateCategory = (data: CategoryFormSchema) => {
        createCategory({ name: data.name });
    };

    const handleSubmitEditCategory = (data: CategoryFormSchema) => {
        if (!categoryToEdit) return;
        editCategory({ categoryId: categoryToEdit, name: data.name });
    };

    const handleSubmitDeleteCategory = () => {
        if (!categoryToDelete) return;
        deleteCategory({ categoryId: categoryToDelete });
    };

    const handleClickEditCategory = (category: { id: string; name: string }) => {
        setCategoryToEdit(category.id);
        editCategoryForm.reset({ name: category.name });
    };

    const handleClickDeleteCategory = (categoryId: string) => {
        setCategoryToDelete(categoryId);
    };

    return (
        <>
            <DashboardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <DashboardTitle>Category Management</DashboardTitle>
                        <DashboardDescription>Organize your products with custom categories.</DashboardDescription>
                    </div>

                    <AlertDialog open={isCreateCategoryAlertDialogOpen} onOpenChange={setIsCreateCategoryAlertDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button>Add New Category</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Add New Category</AlertDialogTitle>
                            </AlertDialogHeader>
                            <Form {...createCategoryForm}>
                                <CategoryForm onSubmit={handleSubmitCreateCategory} submitText="Create Category" />
                            </Form>

                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={createCategoryForm.handleSubmit(handleSubmitCreateCategory)}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </DashboardHeader>

            <div className="grid grid-cols-4 gap-2">
                {categoriesIsLoading && <span>Loading...</span>}
                {categories?.map((category) => {
                    return (
                        <CategoryCatalogCard
                            key={category.id}
                            name={category.name}
                            productCount={category.productCount}
                            onEdit={() => handleClickEditCategory(category)}
                            onDelete={() => handleClickDeleteCategory(category.id)}
                        />
                    );
                })}
            </div>

            <AlertDialog
                open={!!categoryToEdit}
                onOpenChange={(open) => {
                    if (!open) setCategoryToEdit(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Edit Category</AlertDialogTitle>
                    </AlertDialogHeader>

                    <Form {...editCategoryForm}>
                        <CategoryForm onSubmit={handleSubmitEditCategory} submitText="Edit Category" />
                    </Form>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button onClick={editCategoryForm.handleSubmit(handleSubmitEditCategory)}>Edit Category</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={!!categoryToDelete}
                onOpenChange={(open) => {
                    if (!open) setCategoryToDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>Are you sure you want to delete this category? This action cannot be undone.</AlertDialogDescription>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button variant="destructive" onClick={handleSubmitDeleteCategory}>
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

CategoriesPage.getLayout = (page: ReactElement) => {
    return <DashboardLayout>{page}</DashboardLayout>;
};

export default CategoriesPage;
