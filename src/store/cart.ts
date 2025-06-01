import { create } from 'zustand';

type CartItem = {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    quantity: number;
};

type AddToCartItem = Omit<CartItem, 'quantity'>;

interface CartState {
    items: CartItem[];
    addToCart: (newItem: AddToCartItem) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
    items: [],
    addToCart: (newItem) => {
        set((currentState) => {
            const duplicateItems = [...currentState.items];

            const isItemExist = duplicateItems.findIndex((item) => item.id === newItem.id);

            if (isItemExist === -1) {
                duplicateItems.push({
                    id: newItem.id,
                    name: newItem.name,
                    price: newItem.price,
                    imageUrl: newItem.imageUrl,
                    quantity: 1,
                });
            } else {
                const itemToUpdate = duplicateItems[isItemExist];
                if (!itemToUpdate)
                    return {
                        ...currentState,
                    };

                itemToUpdate.quantity += 1;
            }

            return {
                ...currentState,
                items: duplicateItems,
            };
        });
    },
    clearCart: () => {
        set((currentState) => {
            return {
                ...currentState,
                items: [],
            };
        });
    },
}));
