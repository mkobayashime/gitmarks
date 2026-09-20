import { useCallback, useEffect, useState } from "react";

export type Toast = {
	id: string;
	message: string;
	type: "success" | "error" | "info";
};

let nextId = 0;

export const useToast = () => {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const add = useCallback((message: string, type: "success" | "error" | "info") => {
		const id = String(nextId++);
		setToasts((prev) => [...prev, { id, message, type }]);
	}, []);

	const remove = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	// Auto-dismiss after 4 seconds
	useEffect(() => {
		const latest = toasts[toasts.length - 1];
		if (!latest) return;
		const timer = setTimeout(() => remove(latest.id), 4000);
		return () => clearTimeout(timer);
	}, [toasts, remove]);

	return { toasts, add, remove };
};
