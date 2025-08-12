import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/LogoSolo.png" 
                alt="SpotVenta Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-black">SpotVenta</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              La plataforma líder en España para comprar, vender y alquilar propiedades. 
              Encuentra tu hogar ideal con nosotros.
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Enlaces rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/search?category=sale" className="text-muted-foreground hover:text-primary transition-colors">
                  Propiedades en venta
                </Link>
              </li>
              <li>
                <Link to="/search?category=rent" className="text-muted-foreground hover:text-primary transition-colors">
                  Propiedades en alquiler
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Publicar propiedad
                </Link>
              </li>
              <li>
                <Link to="/agents" className="text-muted-foreground hover:text-primary transition-colors">
                  Agentes inmobiliarios
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Locations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Ciudades populares</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/search?city=Madrid" className="text-muted-foreground hover:text-primary transition-colors">
                  Madrid
                </Link>
              </li>
              <li>
                <Link to="/search?city=Barcelona" className="text-muted-foreground hover:text-primary transition-colors">
                  Barcelona
                </Link>
              </li>
              <li>
                <Link to="/search?city=Valencia" className="text-muted-foreground hover:text-primary transition-colors">
                  Valencia
                </Link>
              </li>
              <li>
                <Link to="/search?city=Sevilla" className="text-muted-foreground hover:text-primary transition-colors">
                  Sevilla
                </Link>
              </li>
              <li>
                <Link to="/search?city=Bilbao" className="text-muted-foreground hover:text-primary transition-colors">
                  Bilbao
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                <span>info@spotventa.com</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mr-2" />
                <span>+34 900 123 456</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                <span>Madrid, España</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Newsletter</h4>
              <p className="text-sm text-muted-foreground">
                Recibe las mejores ofertas inmobiliarias
              </p>
              <div className="flex gap-2">
                <Input 
                  placeholder="Tu email" 
                  className="text-sm"
                />
                <Button size="sm" className="bg-gradient-primary">
                  Suscribir
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2024 SpotVenta. Todos los derechos reservados.
          </div>
          <div className="flex space-x-6 text-sm">
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Política de privacidad
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Términos de uso
            </Link>
            <Link to="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
              Cookies
            </Link>
            <Link to="/help" className="text-muted-foreground hover:text-primary transition-colors">
              Ayuda
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}