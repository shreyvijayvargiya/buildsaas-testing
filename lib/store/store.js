import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import subscriptionReducer from "./slices/subscriptionSlice";

const persistConfig = {
	key: "root",
	storage,
	whitelist: ["subscription"], // Only persist subscription slice
};

const persistedSubscriptionReducer = persistReducer(
	persistConfig,
	subscriptionReducer
);

export const store = configureStore({
	reducer: {
		subscription: persistedSubscriptionReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [
					"persist/PERSIST",
					"persist/REHYDRATE",
					"persist/PURGE",
					"subscription/setSubscription", // Timestamps are converted before dispatch
				],
				ignoredPaths: ["subscription.expiresAt"], // Extra safeguard - expiresAt is now ISO string
			},
		}),
});

export const persistor = persistStore(store);

