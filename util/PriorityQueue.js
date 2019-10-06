/**
 * @template T
 */
module.exports = class PriorityQueue {

    /** 
     * @param {((value: T) => number)} comparator 
     */
    constructor(comparator) {
        /** @type {{data: T, priority: number}[]} */
        this.items = [];
        this.comparator = comparator;
    }

    /** @param {number} item */
    add(item) {
        let elem = {
            data: item,
            priority: this.comparator ? this.comparator(item) : 1
        };
        let contain = false;

        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].priority > elem.priority) {
                this.items.splice(i, 0, elem);
                contain = true;
                break;
            }
        }

        if (!contain) {
            this.items.push(elem);
        }
    }

    poll() {
        return this.isEmpty() ? undefined : this.items.shift().data;
    }

    isEmpty() {
        return this.items.length;
    }
}