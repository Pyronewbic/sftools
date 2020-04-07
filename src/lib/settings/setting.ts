import { Connection } from "@salesforce/core";

abstract class Setting {

    private conn: Connection;
    protected metadata;
    protected file: string;


    constructor(conn: Connection){
        this.conn = conn;
    }
    
    protected abstract async setMetadata(name: string, value: any);

    public async update (name:string, value: any){
        
        //set metadata
        this.setMetadata(name, value);
        //update setting file
        return await this.conn.metadata.update(this.file, this.metadata, null);
    }


}

export class OrgPreference extends Setting{
    constructor(conn: Connection){
        super(conn);
        this.file = 'OrgPreferenceSettings';
    }
    async setMetadata(name: string, value: any) {
        
        this.metadata = [{
            preferences : {
              settingName: name,
              settingValue: value
            }
        }];

    }
}

export class ApexSettings extends Setting{
    constructor(conn: Connection){
        super(conn);
        this.file = 'ApexSettings';
    }

    async setMetadata(name: string, value: any) {

        this.metadata = [{
            [name] : value
        }] 

    }
}