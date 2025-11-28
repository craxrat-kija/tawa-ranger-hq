import { Sun, Moon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="border-green-500/50 hover:bg-green-500/10 text-green-500">
          {theme === "light" && <Sun className="h-5 w-5 text-green-500" />}
          {theme === "dark" && <Moon className="h-5 w-5 text-green-500" />}
          {theme === "tawa" && <Shield className="h-5 w-5 text-green-500" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("tawa")}>
          <Shield className="mr-2 h-4 w-4" />
          TAWA
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
