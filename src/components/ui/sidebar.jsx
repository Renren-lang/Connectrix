import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({ className, ...props }) => {
  const { isOpen } = useSidebar();

  return (
    <div
      className={cn(
        "flex h-screen w-16 flex-col bg-gray-800 border-r border-gray-700 transition-all duration-300",
        isOpen && "w-64",
        className
      )}
      {...props}
    />
  );
};

export const SidebarHeader = ({ className, ...props }) => {
  return (
    <div
      className={cn("flex items-center justify-center p-4 border-b border-gray-700", className)}
      {...props}
    />
  );
};

export const SidebarContent = ({ className, ...props }) => {
  return (
    <div
      className={cn("flex-1 overflow-y-auto py-4", className)}
      {...props}
    />
  );
};

export const SidebarFooter = ({ className, ...props }) => {
  return (
    <div
      className={cn("p-4 border-t border-gray-700", className)}
      {...props}
    />
  );
};

export const SidebarGroup = ({ className, ...props }) => {
  return (
    <div
      className={cn("px-3 py-2", className)}
      {...props}
    />
  );
};

export const SidebarMenu = ({ className, ...props }) => {
  return (
    <ul
      className={cn("space-y-1", className)}
      {...props}
    />
  );
};

export const SidebarMenuItem = ({ className, ...props }) => {
  return (
    <li
      className={cn("", className)}
      {...props}
    />
  );
};

export const SidebarMenuButton = ({ 
  className, 
  children, 
  icon, 
  isActive = false,
  onClick,
  ...props 
}) => {
  const { isOpen } = useSidebar();

  return (
    <button
      className={cn(
        "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
        "hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
        isActive && "bg-gray-700 text-white",
        !isActive && "text-gray-300 hover:text-white",
        !isOpen && "justify-center",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {icon && (
        <span className={cn("flex-shrink-0", isOpen && "mr-3")}>
          {icon}
        </span>
      )}
      {isOpen && children}
    </button>
  );
};

export const SidebarToggle = ({ className, ...props }) => {
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <button
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors",
        className
      )}
      onClick={toggleSidebar}
      {...props}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
        />
      </svg>
    </button>
  );
};
