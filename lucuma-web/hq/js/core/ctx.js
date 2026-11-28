// Shared mutable app context. main.js fills it in at boot; modules import it.
export const ctx={session:null,me:null,role:'employee',can:()=>true,go:h=>{location.hash=h},log:()=>{},refreshNav:()=>{},openSearch:()=>{}};
