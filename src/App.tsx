import { AppSidebar } from "@/components/app-sidebar";
import { Navbar } from "@/components/navbar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Navbar />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

export default App;
