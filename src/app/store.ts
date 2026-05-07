import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "../features/counter/counterSlice";
import authReducer from "../features/auth/authSlice";
import guardReducer from "../features/guards/guardSlice";
import inventoryReducer from "../features/inventories/inventorySlice";
import siteReducer from "../features/sites/siteSlice";
import quickBillReducer from "../features/quickBills/quickBillSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    guards: guardReducer,
    inventories: inventoryReducer,
    sites: siteReducer,
    quickBills: quickBillReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
