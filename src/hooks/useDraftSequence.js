/**
 * Hook to generate the draft sequence based on settings
 */
export function generateDraftSequence({
  numberOfBans,
  teamNames,
  startingTeam = null
}) {
  console.log('Generazione sequenza draft:', {
    numberOfBans,
    teamNames,
    startingTeam
  });

  if (!startingTeam) {
    startingTeam = Math.random() < 0.5 ? 'blue' : 'red';
  }

  const sequence = [];

  // Determina il numero di ban per ciascuna fase in base alla configurazione
  let firstBanCount = 0;
  let secondBanCount = 0;

  switch (parseInt(numberOfBans)) {
    case 1:
      firstBanCount = 1;
      secondBanCount = 0;
      break;
    case 2:
      firstBanCount = 1;
      secondBanCount = 1;
      break;
    case 3:
      firstBanCount = 1;
      secondBanCount = 2;
      break;
    case 4:
      firstBanCount = 2;
      secondBanCount = 2;
      break;
    default:
      firstBanCount = 1;
      secondBanCount = 1;
  }

  console.log(`Generating draft sequence: ${numberOfBans} bans, first=${firstBanCount}, second=${secondBanCount}`);

  // ==================== FIRST BAN PHASE ====================
  // Initial bans
  if (firstBanCount > 0) {
    if (firstBanCount === 1) {
      // One ban per team, one turn each
      sequence.push(
        {
          type: 'ban',
          team: 'blue',
          slot: 'blueBan1',
          phase: `Ban - ${teamNames.blue} Team`,
          multiSelect: false,
          selectCount: 1
        },
        {
          type: 'ban',
          team: 'red',
          slot: 'redBan1',
          phase: `Ban - ${teamNames.red} Team`,
          multiSelect: false,
          selectCount: 1
        }
      );
    } else if (firstBanCount === 2) {
      // Two bans per team in one step each
      sequence.push(
        {
          type: 'ban',
          team: 'blue',
          slot: 'blueBan1',
          phase: `Ban (2) - ${teamNames.blue} Team`,
          multiSelect: true,
          selectCount: 2,
          additionalSlots: ['blueBan2']
        },
        {
          type: 'ban',
          team: 'red',
          slot: 'redBan1',
          phase: `Ban (2) - ${teamNames.red} Team`,
          multiSelect: true,
          selectCount: 2,
          additionalSlots: ['redBan2']
        }
      );
    }
  }

  // ==================== FIRST PICK PHASE ====================
  // First pick phase with pattern B→R→R→B→B→R
  sequence.push(
    // Blue selects first hero
    {
      type: 'pick',
      team: 'blue',
      slot: 'bluePlayer1',
      phase: `Pick - ${teamNames.blue} Team`,
      multiSelect: false,
      selectCount: 1
    },
    // Red selects two heroes
    {
      type: 'pick',
      team: 'red',
      slot: 'redPlayer1',
      phase: `Pick (2) - ${teamNames.red} Team`,
      multiSelect: true,
      selectCount: 2,
      additionalSlots: ['redPlayer2']
    },
    // Blue selects two heroes
    {
      type: 'pick',
      team: 'blue',
      slot: 'bluePlayer2',
      phase: `Pick (2) - ${teamNames.blue} Team`,
      multiSelect: true,
      selectCount: 2,
      additionalSlots: ['bluePlayer3']
    },
    // Red selects one hero
    {
      type: 'pick',
      team: 'red',
      slot: 'redPlayer3',
      phase: `Pick - ${teamNames.red} Team`,
      multiSelect: false,
      selectCount: 1
    }
  );

  // ==================== SECOND BAN PHASE ====================
  // Secondary bans
  if (secondBanCount > 0) {
    if (secondBanCount === 1) {
      // One additional ban per team, one turn each
      sequence.push(
        {
          type: 'ban',
          team: 'red',
          slot: 'redBan2',
          phase: `Secondary Ban - ${teamNames.red} Team`,
          multiSelect: false,
          selectCount: 1
        },
        {
          type: 'ban',
          team: 'blue',
          slot: 'blueBan2',
          phase: `Secondary Ban - ${teamNames.blue} Team`,
          multiSelect: false,
          selectCount: 1
        }
      );
    } else if (secondBanCount === 2) {
      // Two additional bans per team, one turn each
      sequence.push(
        {
          type: 'ban',
          team: 'red',
          slot: 'redBan2',
          phase: `Secondary Ban (2) - ${teamNames.red} Team`,
          multiSelect: true,
          selectCount: 2,
          additionalSlots: ['redBan3']
        },
        {
          type: 'ban',
          team: 'blue',
          slot: 'blueBan2',
          phase: `Secondary Ban (2) - ${teamNames.blue} Team`,
          multiSelect: true,
          selectCount: 2,
          additionalSlots: ['blueBan3']
        }
      );
    }
  }

  // ==================== SECOND PICK PHASE ====================
  // Second pick phase with R→B→B→R
  sequence.push(
    // Red selects one hero
    {
      type: 'pick',
      team: 'red',
      slot: 'redPlayer4',
      phase: `Pick - ${teamNames.red} Team`,
      multiSelect: false,
      selectCount: 1
    },
    // Blue selects two heroes
    {
      type: 'pick',
      team: 'blue',
      slot: 'bluePlayer4',
      phase: `Pick (2) - ${teamNames.blue} Team`,
      multiSelect: true,
      selectCount: 2,
      additionalSlots: ['bluePlayer5']
    },
    // Red selects the last hero
    {
      type: 'pick',
      team: 'red',
      slot: 'redPlayer5',
      phase: `Pick - ${teamNames.red} Team`,
      multiSelect: false,
      selectCount: 1
    }
  );

  console.log("Generated sequence:", sequence);
  return sequence;
}