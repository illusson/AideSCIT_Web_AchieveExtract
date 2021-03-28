export class Map<K, V> {
    private keys: K[] = [];
    private values: V[] = [];

    public set(key: K, value: V): Map<K, V> {
        const index: number = this.indexOf(key);
        if (index === -1){
            this.keys.push(key);
            this.values.push(value);
        } else {
            this.values[index] = value;
        }
        return this;
    }

    public indexOf(key: K): number {
        let index: number = -1;
        this.keys.forEach(function (v, i) {
            if (v === key){
                index = i;
            }
        });
        return index;
    }

    public get(key: K): V | null {
        const index: number = this.indexOf(key);
        if (index === -1){
            return null;
        } else {
            return this.values[index];
        }
    }

    public delete(key: K): boolean {
        const index: number = this.indexOf(key);
        if (index === -1){
            return false;
        } else {
            this.keys.splice(index, 1);
            this.values.splice(index, 1);
            return true;
        }
    }

    public forEach(callback: MapForEachCallback<K, V>){
        for (let i: number = 0; i < this.keys.length; i++){
            callback.onEach(this.keys[i], this.values[i], this);
        }
    }
}

export interface MapForEachCallback<K, V> {
    onEach(key: K, value: V, map: Map<K, V>): void
}