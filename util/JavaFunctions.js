module.exports = {

    /** 
     * @param {number} low 
     * @param {number} high
     * @returns {number}
     */
    randomInt: (low, high) => high ? 
        low + ~~(Math.random() * (high - low)) : 
        module.exports.randomInt(0, low),

    /**
     * @param {number} low 
     * @param {number} high
     * @param {number} factor
     */
    interpolate: (low, high, factor) => ~~(low + factor * (high - low)),

    /** 
     * @template T
     * @param {T[]} array
     * @return {T[]}
     */
    shuffle: array => {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    /**
     * @param {[][]} lists
     */
    getLargetSize: lists => {
        return lists.map(list => list.length).sort((a, b) => b - a)[0];
    }
}