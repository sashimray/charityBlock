'use strict';
 const { Contract } = require('fabric-contract-api');

 const projectState = {
     COLLECTING:1,
     ACHIEVED:2
 }

 class CharityContract extends Contract{
     
    async InitLedger(ctx){
        await this.createCharityProject(ctx, "C1", "Salvation Army Project", "Donate to the Army", 
        "50000", projectState.COLLECTING, "0", "Little Rock", "US Army");
    }

    async createDonation(ctx, donationId, value, projectId) {
        var donation = await this.assetExists(ctx, donationId);
        if (donation) {
            throw new Error(`The donation ${donationId} already exists`);
        }
        
        var project = await this.readAsset(ctx, projectId);
        
        var intCurrentValue = parseInt(project.currentValue);
        var intLimit = parseInt(project.limit);
        var intAddedValue = parseInt(value);

        intCurrentValue += intAddedValue;

        if(intCurrentValue >= intLimit) {
            project.owner = project.org;
            project.state = projectState.ACHIEVED;
        }

        project.currentValue = intCurrentValue.toString();

        const projectBuffer = Buffer.from(JSON.stringify(project));
        await ctx.stub.putState(projectId, projectBuffer);

        var donation = { value, projectId }

        const donationBuffer = Buffer.from(JSON.stringify(donation));
        await ctx.stub.putState(donationId, donationBuffer);
    }
    async createCharityProject(ctx, projectId, name, description, limit, status, currentValue, owner, org) {
        var project = await this.assetExists(ctx, projectId);
        if (project) {
            throw new Error(`The project ${projectId} already exists`);
        }

        project = { name, description, limit, status, currentValue, owner, org }
        
        const projectBuffer = Buffer.from(JSON.stringify(project));
        await ctx.stub.putState(projectId, projectBuffer);

    }

    async readAsset(ctx, assetId) {
        const exists = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        const buffer = await ctx.stub.getState(assetId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    async assetExists(ctx, assetId) {
        const buffer = await ctx.stub.getState(assetId);
        return (!!buffer && buffer.length > 0);
    }
 }
 module.exports = CharityContract;