import { ReferenceField, useRecordContext } from "react-admin";

// Las asistencias guardan infante_id, no el nombre del infante.
// Este componente sirve como etiqueta en los selectores de asistencia.
export const AsistenciaOpcion = () => {
  const asistencia = useRecordContext();
  if (!asistencia) return null;

  const fecha = String(asistencia.fecha ?? "").slice(0, 10);
  const fechaVisible = /^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ? fecha.split("-").reverse().join("/")
    : "Sin fecha";
  const turno = asistencia.turno === "matutino"
    ? "Matutino"
    : asistencia.turno === "vespertino"
      ? "Vespertino"
      : asistencia.turno || "Sin turno";

  return (
    <span>
      <ReferenceField
        source="infante_id"
        reference="infantes"
        record={asistencia}
        link={false}
        emptyText="Infante no disponible"
      />
      {` — ${fechaVisible} — ${turno}`}
    </span>
  );
};
