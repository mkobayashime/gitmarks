import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactElement } from "react";
import { forwardRef } from "react";
import { cn } from "../utils/cn";

const buttonVariants = cva(
	[
		"cursor-pointer",
		"rounded-md",
		"inline-flex",
		"items-center",
		"justify-center",
		"gap-1.5",
		"text-sm",
		"font-medium",
		"transition-colors",
		"disabled:cursor-not-allowed",
		"disabled:opacity-40",
		"focus-visible:outline-none",
		"focus-visible:ring-2",
		"focus-visible:ring-pink-500/50",
		"focus-visible:ring-offset-2",
		"focus-visible:ring-offset-zinc-950",
	],
	{
		variants: {
			kind: {
				primary: [
					"border",
					"border-transparent",
					"bg-pink-500",
					"text-white",
					"hover:bg-pink-600",
				],
				secondary: [
					"border",
					"border-zinc-700",
					"bg-zinc-800",
					"text-zinc-400",
					"hover:bg-zinc-700",
				],
				text: ["text-zinc-500", "hover:text-zinc-400"],
				ghost: ["text-zinc-500", "hover:bg-zinc-800", "hover:text-zinc-300"],
			},
			dangerous: {
				true: [
					"text-red-400",
					"hover:text-red-500",
					"data-[kind=secondary]:border-red-500/30",
					"data-[kind=secondary]:bg-red-500/10",
					"data-[kind=secondary]:hover:bg-red-500/20",
				],
			},
			size: {
				sm: ["px-2.5", "py-1", "text-xs"],
				md: ["px-3", "py-1.5"],
				lg: ["px-4", "py-1.5"],
			},
		},
		compoundVariants: [
			// Primary dangerous (full red background)
			{
				kind: "primary",
				dangerous: true,
				class: [
					"bg-red-500",
					"hover:bg-red-600",
					"text-white",
					"hover:text-white",
				],
			},
			// Text dangerous (link-like)
			{
				kind: "text",
				dangerous: true,
				class: ["text-red-400", "hover:text-red-500", "hover:bg-red-900/30"],
			},
		],
		defaultVariants: {
			kind: "primary",
			dangerous: false,
			size: "md",
		},
	},
);

export type { VariantProps } from "class-variance-authority";
export type ButtonVariants = VariantProps<typeof buttonVariants>;
export { buttonVariants };

export type ButtonIcon = ReactElement | null;

export interface ButtonProps extends ComponentProps<"button">, ButtonVariants {
	icon?: ButtonIcon;
	trailingIcon?: ButtonIcon;
	loading?: boolean;
	unstyled?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			children,
			className,
			kind,
			dangerous,
			size,
			icon,
			trailingIcon,
			loading = false,
			unstyled = false,
			disabled,
			type = "button",
			...props
		},
		ref,
	) => {
		const isDisabled = disabled || loading;
		const variantClasses = unstyled
			? ""
			: buttonVariants({ kind, dangerous, size });

		return (
			<button
				ref={ref}
				type={type}
				disabled={isDisabled}
				className={cn(variantClasses, className)}
				data-kind={kind}
				data-loading={loading}
				aria-busy={loading}
				{...props}
			>
				{loading ? (
					<>
						<span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
						{children && <span>{children}</span>}
					</>
				) : (
					<>
						{icon && <span className="inline-flex items-center">{icon}</span>}
						{children && <span>{children}</span>}
						{trailingIcon && (
							<span className="inline-flex items-center">{trailingIcon}</span>
						)}
					</>
				)}
			</button>
		);
	},
);

Button.displayName = "Button";
