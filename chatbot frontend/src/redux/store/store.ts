import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { chatReducer } from "../slices";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";

const persistConfig = {
	key: "rawabotew",
	storage,
};

const rootReducer = combineReducers({
	// [apiService.reducerPath]: apiService.reducer,
	chats: chatReducer,
});

const store = configureStore({
	reducer: persistReducer(persistConfig, rootReducer),
	middleware: (getDefaultMiddleware) =>
		// getDefaultMiddleware().concat(apiService.middleware),
		getDefaultMiddleware({ serializableCheck: false }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

const useAppDispatch: () => AppDispatch = useDispatch;
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
const persistor = persistStore(store);
export { store, useAppDispatch, useAppSelector, persistor };
