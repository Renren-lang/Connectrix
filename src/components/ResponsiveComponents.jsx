import React from 'react';
import './ResponsiveComponents.css';

// ========================================
// RESPONSIVE HEADER COMPONENT
// ========================================
export const ResponsiveHeader = ({ 
  logo, 
  title, 
  navigation, 
  isScrolled = false,
  className = '' 
}) => {
  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''} ${className}`}>
      <div className="container">
        <div className="header-content">
          {/* Logo Section */}
          <div className="logo">
            {logo && (
              <img 
                src={logo} 
                alt={title || 'Logo'} 
                className="logo-image"
              />
            )}
            {title && (
              <span className="logo-text">{title}</span>
            )}
          </div>
          
          {/* Navigation Section */}
          {navigation && (
            <nav className="nav">
              {navigation}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

// ========================================
// RESPONSIVE CARD COMPONENT
// ========================================
export const ResponsiveCard = ({ 
  children, 
  header, 
  footer, 
  className = '',
  hover = true 
}) => {
  return (
    <div className={`card ${hover ? 'hover' : ''} ${className}`}>
      {header && (
        <div className="card-header">
          {header}
        </div>
      )}
      
      <div className="card-body">
        {children}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

// ========================================
// RESPONSIVE BUTTON COMPONENT
// ========================================
export const ResponsiveButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  onClick,
  className = '',
  type = 'button'
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost'
  };
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  };
  
  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    fullWidth ? 'w-full' : '',
    disabled ? 'disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
          </svg>
        </span>
      )}
      
      {icon && !loading && (
        <span className="btn-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      
      <span className={loading ? 'opacity-0' : ''}>
        {children}
      </span>
    </button>
  );
};

// ========================================
// RESPONSIVE INPUT COMPONENT
// ========================================
export const ResponsiveInput = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) => {
  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="form-input-icon">
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`form-input ${error ? 'error' : ''} ${icon ? 'pl-10' : ''}`}
          {...props}
        />
      </div>
      
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}
    </div>
  );
};

// ========================================
// RESPONSIVE GRID COMPONENT
// ========================================
export const ResponsiveGrid = ({ 
  children, 
  cols = 1,
  gap = 'md',
  className = '' 
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };
  
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
  };
  
  const classes = [
    'grid',
    colsClasses[cols] || colsClasses[1],
    gapClasses[gap] || gapClasses.md,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

// ========================================
// RESPONSIVE CONTAINER COMPONENT
// ========================================
export const ResponsiveContainer = ({ 
  children, 
  maxWidth = 'xl',
  className = '' 
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full'
  };
  
  const classes = [
    'container',
    maxWidthClasses[maxWidth] || maxWidthClasses.xl,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

// ========================================
// RESPONSIVE HERO COMPONENT
// ========================================
export const ResponsiveHero = ({ 
  title, 
  subtitle, 
  actions,
  background,
  className = '' 
}) => {
  return (
    <section 
      className={`hero ${className}`}
      style={background ? { background } : {}}
    >
      <div className="hero-content">
        {title && (
          <h1 className="hero-title">
            {title}
          </h1>
        )}
        
        {subtitle && (
          <p className="hero-subtitle">
            {subtitle}
          </p>
        )}
        
        {actions && (
          <div className="hero-actions">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
};

// ========================================
// RESPONSIVE SECTION COMPONENT
// ========================================
export const ResponsiveSection = ({ 
  children, 
  title,
  subtitle,
  className = '' 
}) => {
  return (
    <section className={`section ${className}`}>
      <div className="container">
        {title && (
          <h2 className="section-title">
            {title}
          </h2>
        )}
        
        {subtitle && (
          <p className="section-subtitle text-center text-gray-600 mb-12">
            {subtitle}
          </p>
        )}
        
        {children}
      </div>
    </section>
  );
};

// ========================================
// RESPONSIVE MODAL COMPONENT
// ========================================
export const ResponsiveModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = '' 
}) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button 
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

// ========================================
// RESPONSIVE NAVIGATION COMPONENT
// ========================================
export const ResponsiveNavigation = ({ 
  items, 
  orientation = 'horizontal',
  className = '' 
}) => {
  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col'
  };
  
  return (
    <nav className={`nav ${orientationClasses[orientation]} ${className}`}>
      {items.map((item, index) => (
        <a
          key={index}
          href={item.href}
          className={`nav-item ${item.active ? 'active' : ''}`}
          onClick={item.onClick}
        >
          {item.icon && (
            <span className="nav-item-icon" aria-hidden="true">
              {item.icon}
            </span>
          )}
          <span className="nav-item-text">{item.label}</span>
        </a>
      ))}
    </nav>
  );
};

// ========================================
// RESPONSIVE UTILITY COMPONENTS
// ========================================

// Show/Hide based on screen size
export const ResponsiveShow = ({ 
  children, 
  breakpoint = 'md',
  className = '' 
}) => {
  const classes = `hidden ${breakpoint}:block ${className}`;
  return <div className={classes}>{children}</div>;
};

export const ResponsiveHide = ({ 
  children, 
  breakpoint = 'md',
  className = '' 
}) => {
  const classes = `block ${breakpoint}:hidden ${className}`;
  return <div className={classes}>{children}</div>;
};

// Responsive spacing
export const ResponsiveSpacer = ({ 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'h-2',
    sm: 'h-4',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
    '2xl': 'h-24'
  };
  
  return <div className={`${sizeClasses[size]} ${className}`} />;
};

// Responsive divider
export const ResponsiveDivider = ({ 
  orientation = 'horizontal',
  className = '' 
}) => {
  const orientationClasses = {
    horizontal: 'w-full h-px',
    vertical: 'h-full w-px'
  };
  
  return (
    <div 
      className={`bg-gray-300 ${orientationClasses[orientation]} ${className}`}
      aria-hidden="true"
    />
  );
};

