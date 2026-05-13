import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { AllocationsRepository } from '../repositories/allocations.repository';
import { AppError, normalizeAppError } from '@app/core/errors/app-error';

type RefItem = { id: string; name: string };
type RefGreenhouse = RefItem & { locationId: string };
type RefZone = RefItem & { greenhouseId: string };
type RefSystem = RefItem & { zoneId: string };
type RefLayer = RefItem & { systemId: string };
type RefPipe = RefItem & { layerId: string };

@Injectable({ providedIn: 'root' })
export class LoadAllocationReferencesUseCase {
  readonly #repo = inject(AllocationsRepository);

  execute(params: {
    destroyRef: DestroyRef;
    setLocations: (items: RefItem[]) => void;
    setGreenhouses: (items: RefGreenhouse[]) => void;
    setZones: (items: RefZone[]) => void;
    setSystems: (items: RefSystem[]) => void;
    setLayers: (items: RefLayer[]) => void;
    setPipes: (items: RefPipe[]) => void;
    setError: (message: string | null) => void;
  }): void {
    const {
      destroyRef,
      setLocations,
      setGreenhouses,
      setZones,
      setSystems,
      setLayers,
      setPipes,
      setError,
    } = params;

    forkJoin({
      locations: this.#repo.getRefLocations(),
      greenhouses: this.#repo.getRefGreenhouses(),
      zones: this.#repo.getRefZones(),
      systems: this.#repo.getRefSystems(),
      layers: this.#repo.getRefLayers(),
      pipes: this.#repo.getRefPipes(),
    })
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe({
        next: ({ locations, greenhouses, zones, systems, layers, pipes }) => {
          setLocations(locations);
          setGreenhouses(greenhouses);
          setZones(zones);
          setSystems(systems);
          setLayers(layers);
          setPipes(pipes);
        },
        error: (error: unknown) => {
          const appError: AppError = normalizeAppError(error);
          setError(appError.message);
        },
      });
  }
}
