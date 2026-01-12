import { HhVacancy } from '#services/HhService'

export class StateManager {
    public unreadVacancies: HhVacancy[] = []
    public statusMessageId: number | undefined

    addVacancy(vacancy: HhVacancy) {
        if (this.unreadVacancies.some(v => v.id === vacancy.id)) {
            return
        }
        this.unreadVacancies.push(vacancy)
    }

    clearVacancies() {
        this.unreadVacancies = []
    }

    filterVacancies(predicate: (v: HhVacancy) => boolean) {
        this.unreadVacancies = this.unreadVacancies.filter(predicate)
    }

    getVacancies(predicate?: (v: HhVacancy) => boolean) {
        if (predicate) {
            return this.unreadVacancies.filter(predicate)
        }
        return this.unreadVacancies
    }
}
