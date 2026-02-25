import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      duration={4000}
      offset="16px"
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "font-sans text-sm shadow-lg border",
          title: "font-semibold",
          description: "text-xs opacity-80",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
