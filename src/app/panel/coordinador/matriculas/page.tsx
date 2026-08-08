// El wizard de matrícula ya filtra cursos "published" y no expone ninguna
// acción de gestión de cursos (crear/editar/eliminar), así que es seguro
// reutilizarlo tal cual para el rol coordinador sin duplicar lógica.
export { default } from "@/app/panel/soporte/matriculas/page";
