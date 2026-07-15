"use client";

import { Component, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { hasError: boolean; resetCount: number };

/**
 * Fängt Render-Fehler im Abrechnungs-Wizard ab (z. B. unerwartete Datenfehler)
 * und zeigt eine verständliche deutsche Meldung mit „Zurück"-Möglichkeit –
 * statt der nackten Browser-Fehlerseite. „Zurück" mountet den Wizard neu.
 */
export class WizardErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetCount: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  handleReset = () => {
    this.setState((s) => ({ hasError: false, resetCount: s.resetCount + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-base font-medium">Etwas ist schiefgelaufen</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Beim Aufbereiten der Abrechnungsdaten ist ein Fehler aufgetreten.
              Bitte prüfe die zugrunde liegenden Belege und Mietverhältnisse
              (z. B. fehlende Angaben) und versuche es erneut.
            </p>
            <Button onClick={this.handleReset}>Zurück zum Start</Button>
          </CardContent>
        </Card>
      );
    }
    // Keyed Wrapper: erneuter Versuch mountet die Kinder frisch.
    return <div key={this.state.resetCount}>{this.props.children}</div>;
  }
}
