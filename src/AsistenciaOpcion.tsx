import { ReferenceField, useRecordContext } from "react-admin";

// Las asistencias guardan infante_id, no el nombre del infante.
// Aquí vamos a guardar el nombre del infante para mostrarlo en los selectores de asistencia
// Este componente sirve como etiqueta en los selectores de asistencia.
export const AsistenciaOpcion = () => {
  const asistencia = useRecordContext();
  if (!asistencia) return null;

  //
  //Asignar  fecha y turno a variables para mostrarlas en el selector de asistencia
  const fecha = String(asistencia.fecha ?? "").slice(0, 10);
  // Manera de mostrar la fecha en formato dd/mm/yyyy
  const fechaVisible = /^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ? fecha.split("-").reverse().join("/")
    : "Sin fecha";

    // Aquí se asigna el turno a una variable para mostrarlo en el selector de asistencia
  const turno = asistencia.turno === "matutino"
    ? "Matutino"
    : asistencia.turno === "vespertino"
      ? "Vespertino"
      : asistencia.turno || "Sin turno";

    //Aquí retornamos el nombre del infante, la fecha y el turno para mostrarlos en el selector de asistencia
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
