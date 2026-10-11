import { describe, expect, it } from 'vitest';
import { cantidad, centimos, euros, leerNumero, numero, platos, precioPorUnidad, raciones, redondeoFrase } from '../src/calc/format';

describe('redondeo de céntimos', () => {
  it('0,475 se muestra como 0,48 y no 0,47', () => {
    expect(centimos(0.475)).toBe(0.48);
    expect(euros(0.475)).toBe('0,48 €');
  });
  it('casos típicos', () => {
    expect(euros(1.1)).toBe('1,10 €');
    expect(euros(4.0914)).toBe('4,09 €');
    expect(euros(0)).toBe('0,00 €');
    expect(euros(11.64)).toBe('11,64 €');
    expect(centimos(1.005)).toBe(1.01);
  });
});

describe('formato de cantidades', () => {
  it('coma decimal y unidad detrás', () => {
    expect(cantidad(300, 'g')).toBe('300 g');
    expect(cantidad(0.25, 'envase')).toBe('0,25 envase');
    expect(cantidad(0.5, 'envase')).toBe('0,5 envase');
    expect(cantidad(1, 'envase')).toBe('1 envase');
    expect(cantidad(2, 'envase')).toBe('2 envases');
    expect(cantidad(1, 'ud')).toBe('1 ud');
    expect(cantidad(30, 'ml')).toBe('30 ml');
    expect(numero(6.8)).toBe('6,8');
    expect(raciones(6.8)).toBe('6,8 raciones');
    expect(raciones(1)).toBe('1 ración');
  });
  it('precio por unidad en €/kg, €/l, €/ud y €/envase', () => {
    expect(precioPorUnidad(3.74, 550, 'g')).toBe('6,80 €/kg');
    expect(precioPorUnidad(1.2, 250, 'ml')).toBe('4,80 €/l');
    expect(precioPorUnidad(1.8, 6, 'ud')).toBe('0,30 €/ud');
    expect(precioPorUnidad(0.55, 1, 'envase')).toBe('0,55 €/envase');
    expect(precioPorUnidad(1.1, 57, 'g')).toBe('19,30 €/kg');
  });
  it('textos auxiliares', () => {
    expect(platos(0)).toBe('ningún plato');
    expect(platos(1)).toBe('1 plato');
    expect(platos(3)).toBe('3 platos');
    expect(redondeoFrase(0.1)).toBe('los 10 céntimos');
    expect(redondeoFrase(0.05)).toBe('los 5 céntimos');
    expect(redondeoFrase(0.5)).toBe('los 50 céntimos');
  });
});

describe('leer números escritos', () => {
  it('acepta coma y punto', () => {
    expect(leerNumero('0,60')).toBe(0.6);
    expect(leerNumero('0.60')).toBe(0.6);
    expect(leerNumero(' 1,5 € ')).toBe(1.5);
    expect(leerNumero('1.234,5')).toBe(1234.5);
    expect(leerNumero('34')).toBe(34);
    expect(leerNumero(',5')).toBe(0.5);
  });
  it('rechaza lo que no es número', () => {
    expect(leerNumero('')).toBeNull();
    expect(leerNumero('abc')).toBeNull();
    expect(leerNumero('1,2,3')).toBeNull();
  });
});
