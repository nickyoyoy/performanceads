import { describe, it, expect } from 'vitest';
import {
  parseNumber,
  parseInteger,
  parseString,
  mapStatus,
  generateRecordId,
  buildHeaderMapping,
  parseAdsCsv,
} from '../services/parser';
import { FALLBACK_CSV_DATA } from '../services/fixtureData';

describe('Ads Data Parser & Normalizer', () => {
  it('converts "N/A", "-", and empty strings to null', () => {
    expect(parseString('N/A')).toBeNull();
    expect(parseString('n/a')).toBeNull();
    expect(parseString('-')).toBeNull();
    expect(parseString('')).toBeNull();
    expect(parseString('   ')).toBeNull();
    expect(parseString(null)).toBeNull();
    expect(parseString('Shopee')).toBe('Shopee');
  });

  it('converts valid numeric strings into numbers', () => {
    expect(parseNumber('8182656')).toBe(8182656);
    expect(parseNumber('61010394')).toBe(61010394);
    expect(parseNumber('7.46')).toBe(7.46);
    expect(parseNumber('7,46')).toBe(7.46); // Comma decimal
    expect(parseNumber('Rp 8.182.656')).toBe(8182656); // IDR formatted with dot thousand separator
  });

  it('converts invalid numbers and "N/A" to null, NEVER 0', () => {
    expect(parseNumber('N/A')).toBeNull();
    expect(parseNumber('-')).toBeNull();
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('invalid_text')).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
  });

  it('converts integer strings correctly', () => {
    expect(parseInteger('304')).toBe(304);
    expect(parseInteger('304.0')).toBe(304);
    expect(parseInteger('N/A')).toBeNull();
  });

  it('generates a stable deterministic record ID', () => {
    const id1 = generateRecordId('2026-11-09', 'Shopee', 'Shopee Ads (CPC, semua campaign)');
    const id2 = generateRecordId('2026-11-09', 'Shopee', 'Shopee Ads (CPC, semua campaign)');
    expect(id1).toBe(id2);
    expect(id1).toContain('2026-11-09');
    expect(id1).toContain('shopee');
  });

  it('header mapping works correctly even if column order changes', () => {
    const scrambledHeaders = [
      'Realisasi Spend Rp',
      'Tanggal WIB',
      'Kanal',
      'ROAS',
      'Jenis iklan',
      'Status data',
    ];
    const mapping = buildHeaderMapping(scrambledHeaders);

    expect(mapping.actualSpend).toBe(0);
    expect(mapping.reportDate).toBe(1);
    expect(mapping.channel).toBe(2);
    expect(mapping.roas).toBe(3);
    expect(mapping.adType).toBe(4);
    expect(mapping.status).toBe(5);
  });

  it('parses WIB dates and handles missing/malformed rows without crashing', () => {
    const malformedCsv = `Tanggal WIB,Kanal,Jenis iklan,Realisasi Spend Rp
2026-11-09,Shopee,Ads,1000000

,,,
2026-11-09,TikTok,Product Ads,N/A
corrupted row without enough columns`;

    const records = parseAdsCsv(malformedCsv);
    expect(records.length).toBe(2);
    expect(records[0].reportDate).toBe('2026-11-09');
    expect(records[0].timezone).toBe('Asia/Jakarta');
    expect(records[0].actualSpend).toBe(1000000);
    expect(records[1].actualSpend).toBeNull();
  });

  it('correctly maps status and detects authentication_required from notes', () => {
    const resVerified = mapStatus('Terverifikasi (API)', null);
    expect(resVerified.status).toBe('verified');

    const resAuth1 = mapStatus('Tidak tersedia', 'Pull 9 Nov gagal: TikTok Seller Center logout, login butuh OTP SMS.');
    expect(resAuth1.status).toBe('authentication_required');

    const resAuth2 = mapStatus('Tidak tersedia', 'Profil Chrome ads tidak punya sesi Ads Manager, login wall Facebook.');
    expect(resAuth2.status).toBe('authentication_required');

    const resUnavail = mapStatus('Tidak tersedia', 'Tidak ada data sama sekali');
    expect(resUnavail.status).toBe('unavailable');
  });

  it('correctly parses the official ScentPlus dataset fixture', () => {
    const records = parseAdsCsv(FALLBACK_CSV_DATA);
    expect(records.length).toBe(4);

    // Record 0: Shopee
    expect(records[0].channel).toBe('Shopee');
    expect(records[0].actualSpend).toBe(8182656);
    expect(records[0].actualRevenue).toBe(61010394);
    expect(records[0].actualOrders).toBe(304);
    expect(records[0].sourceRoas).toBe(7.46);
    expect(records[0].status).toBe('verified');

    // Records 1, 2, 3: TikTok and Meta should have null metrics
    for (let i = 1; i <= 3; i++) {
      expect(records[i].actualSpend).toBeNull();
      expect(records[i].actualRevenue).toBeNull();
      expect(records[i].actualOrders).toBeNull();
      expect(records[i].sourceRoas).toBeNull();
      expect(records[i].status).toBe('authentication_required');
    }
  });
});

