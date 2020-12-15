'use strict';
 const { Contract } = require('fabric-contract-api');

 const projectState = {
     COLLECTING:1,
     ACHIEVED:2,
     EXPIRED:3
 }

const donationState = {
     PLEDGED:1,
     CLAIMED:2,
    EXPIRED:3
 }


 class CharityContract extends Contract{
     
    async InitLedger(ctx){
        const projects=[{
                projectId: 'P1',
                name: 'Salvation Army Project',
                description: 'Salvation Army Project',
                status: projectState.COLLECTING,
                limit: '50000',
                milestone: '3000',
                currentValue: '300',
                org: 'LR Army',
                created: '2020-12-14',
                expires: '10d'
            },
            {
                projectId: 'P2',
                name: 'GiveMeMore Project',
                description: 'Donate Now',
                status: projectState.COLLECTING,
                limit: '100',
                milestone: '30',
                currentValue: '12',
                org: 'Chris Foy Enterprise',
                created: '2020-01-14',
                expires: '1y'

            }]

        for (const asset of assets) {
            asset.docType = 'asset';
            await ctx.stub.putState(asset.ID, Buffer.from(JSON.stringify(asset)));
            console.info(`Asset ${asset.ID} initialized`);
        }
    }

    async createDonationAsset(ctx, donationId, value, projectId) {
        var donation = await this.assetExists(ctx, donationId);
        if (donation) {
            throw new Error(`The donation ${donationId} already exists`);
        }

        var project = await this.readAsset(ctx, projectId);
        
        var donation = { 
            currVal : value, 
            pId : projectId,
            state: donationState.PLEDGED
        }

        var intCurrentValue = parseInt(project.currentValue);
        var intLimit = parseInt(project.limit);
        var intAddedValue = parseInt(value);

        intCurrentValue += intAddedValue;

        if(intCurrentValue >= intLimit) {
            project.owner = project.org;
            project.state = projectState.ACHIEVED;
            donation.state = donation.CLAIMED;
        }

        project.currentValue = intCurrentValue.toString();

        const projectBuffer = Buffer.from(JSON.stringify(project));
        await ctx.stub.putState(projectId, projectBuffer);

        

        const donationBuffer = Buffer.from(JSON.stringify(donation));
        await ctx.stub.putState(donationId, donationBuffer);
    }

    async createCharityProject(ctx, projectId, name, description, limit, status, currentValue,org) {
        var project = await this.assetExists(ctx, projectId);
        if (project) {
            throw new Error(`The project ${projectId} already exists`);
        }

        project = { name, description, limit, status, '0', owner, org }
        
        const projectBuffer = Buffer.from(JSON.stringify(project));
        await ctx.stub.putState(projectId, projectBuffer);
        console.info(`Asset ${project} initialized`);
    }


    // ReadAsset returns the asset stored in the world state with given id.
    async readAsset(ctx, assetId) {
        const exists = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        const assetJSON = await ctx.stub.getState(assetId);
        const asset = JSON.parse(assetJSON.toString());
        return asset;
    }

    
    async assetExists(ctx, assetId) {
        const assetJSON = await ctx.stub.getState(assetId);
        return (!!assetJSON && assetJSON.length > 0);
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: result.value.key, Record: record });
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
 }
 module.exports = CharityContract;