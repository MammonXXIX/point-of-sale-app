import { DashboardDescription, DashboardHeader, DashboardLayout, DashboardTitle } from '@/components/layouts/DashboardLayout';
import { CategoryFilterCard } from '@/components/shared/category/CategoryFilterCard';
import { CreateOrderSheet } from '@/components/shared/CreateOrderSheet';
import { ProductMenuCard } from '@/components/shared/product/ProductMenuCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/cart';
import { api } from '@/utils/api';
import { Search, ShoppingCart } from 'lucide-react';
import type { ReactElement } from 'react';
import { useState } from 'react';
import type { NextPageWithLayout } from '../_app';

const DashboardPage: NextPageWithLayout = () => {
    const cartStore = useCartStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [orderSheetOpen, setOrderSheetOpen] = useState(false);

    const { data: products } = api.product.getProduct.useQuery({ categoryId: selectedCategory });
    const { data: categories } = api.category.getCategories.useQuery();

    const totalProducts = categories?.reduce((a, b) => {
        return a + b._count.Products;
    }, 0);

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategory(categoryId);
    };

    const handleAddToCart = (productId: string) => {
        const productToAdd = products?.find((product) => product.id === productId);

        if (!productToAdd) return;

        cartStore.addToCart({
            id: productToAdd.id,
            name: productToAdd.name,
            price: productToAdd.price,
            imageUrl: productToAdd.imageUrl ?? '',
        });
    };

    return (
        <>
            <DashboardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <DashboardTitle>Dashboard</DashboardTitle>
                        <DashboardDescription>Welcome to your Simple POS system dashboard.</DashboardDescription>
                    </div>

                    {!!cartStore.items.length && (
                        <Button className="animate-in slide-in-from-right" onClick={() => setOrderSheetOpen(true)}>
                            <ShoppingCart /> Cart
                        </Button>
                    )}
                </div>
            </DashboardHeader>

            <div className="space-y-6">
                <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input placeholder="Search products..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                <div className="flex space-x-4 overflow-x-auto pb-2">
                    <CategoryFilterCard
                        key="ALL"
                        name="ALL"
                        productCount={totalProducts ?? 0}
                        isSelected={selectedCategory === 'ALL'}
                        onClick={() => handleCategoryClick('ALL')}
                    />
                    {categories?.map((category) => (
                        <CategoryFilterCard
                            key={category.id}
                            name={category.name}
                            productCount={category._count.Products}
                            isSelected={selectedCategory === category.id}
                            onClick={() => handleCategoryClick(category.id)}
                        />
                    ))}
                </div>

                <div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {products?.map((product) => (
                            <ProductMenuCard
                                key={product.id}
                                id={product.id}
                                name={product.name}
                                price={product.price}
                                imageUrl={product.imageUrl ?? 'https://placehold.co/600x400'}
                                onAddToCart={handleAddToCart}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <CreateOrderSheet open={orderSheetOpen} onOpenChange={setOrderSheetOpen} />
        </>
    );
};

DashboardPage.getLayout = (page: ReactElement) => {
    return <DashboardLayout>{page}</DashboardLayout>;
};

export default DashboardPage;
